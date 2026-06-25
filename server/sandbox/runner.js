import Docker from "dockerode";
import { mkdtemp, rm, writeFile } from "fs/promises";
import { tmpdir } from "os";
import path from "path";
import { runUserCode as runJavaScriptCode } from "../sandbox.js";
import { DEFAULT_LANGUAGE, getLanguageConfig, normalizeLanguage } from "./languages.js";

const docker = new Docker();
const TIMEOUT_MS = 5000;
const CLEANUP_TIMEOUT_MS = 3000;

export class UnsupportedLanguageError extends Error {
  constructor(language) {
    super(`Unsupported language: ${language}`);
    this.name = "UnsupportedLanguageError";
    this.language = language;
  }
}

async function cleanupContainer(container) {
  const removeContainer = container.remove({ force: true }).catch(() => {
    // The container may already be gone after a normal exit or timeout kill.
  });

  await Promise.race([
    removeContainer,
    new Promise((resolve) => {
      setTimeout(resolve, CLEANUP_TIMEOUT_MS);
    }),
  ]);
}

function demuxDockerLogs(logBuffer) {
  let stdout = "";
  let stderr = "";
  let offset = 0;

  while (offset + 8 <= logBuffer.length) {
    const streamType = logBuffer[offset];
    const chunkLength = logBuffer.readUInt32BE(offset + 4);
    const chunkStart = offset + 8;
    const chunkEnd = chunkStart + chunkLength;

    if (chunkEnd > logBuffer.length) {
      break;
    }

    const chunk = logBuffer.subarray(chunkStart, chunkEnd).toString();
    if (streamType === 2) {
      stderr += chunk;
    } else {
      stdout += chunk;
    }

    offset = chunkEnd;
  }

  if (offset === 0 && logBuffer.length > 0) {
    stdout = logBuffer.toString();
  }

  return { stdout, stderr };
}

function buildShellCommand(config) {
  const commands = [];

  if (config.compileCommand) {
    commands.push(config.compileCommand.join(" "));
  }

  commands.push(config.runCommand.join(" "));
  return commands.join(" && ");
}

async function runInContainer(code, config) {
  const tempDir = await mkdtemp(path.join(tmpdir(), "code-sandbox-"));
  const codePath = path.join(tempDir, config.fileName);
  let container;
  let timedOut = false;
  let timeoutId;

  try {
    await writeFile(codePath, code, "utf8");

    container = await docker.createContainer({
      Image: config.image,
      Cmd: ["sh", "-lc", buildShellCommand(config)],
      AttachStdout: true,
      AttachStderr: true,
      Tty: false,
      WorkingDir: "/sandbox",
      HostConfig: {
        AutoRemove: false,
        Memory: 100 * 1024 * 1024,
        CpuQuota: 50000,
        CpuPeriod: 100000,
        NetworkMode: "none",
        PidsLimit: 64,
        Binds: [`${tempDir}:/sandbox:ro`],
      },
    });

    await container.start();

    let timeoutMessage = "";

    const timeout = new Promise((resolve) => {
      timeoutId = setTimeout(() => {
        timedOut = true;
        timeoutMessage = "Execution timed out after 5 seconds.\n";
        container.kill().catch(() => {
          // The container may already be stopped by the time the timeout fires.
        });
        resolve({ StatusCode: 124 });
      }, TIMEOUT_MS);
    });

    const waitForExit = container.wait().catch((error) => {
      if (timedOut) {
        return { StatusCode: 124 };
      }

      throw error;
    });
    const result = await Promise.race([waitForExit, timeout]);
    clearTimeout(timeoutId);
    const logs = await container.logs({ stdout: true, stderr: true });
    const { stdout, stderr } = demuxDockerLogs(logs);

    return {
      stdout,
      stderr: stderr + timeoutMessage,
      exitCode: result.StatusCode,
      timedOut,
    };
  } finally {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    if (container) {
      await cleanupContainer(container);
    }
    await rm(tempDir, { recursive: true, force: true });
  }
}

export async function runCode(code, language = DEFAULT_LANGUAGE) {
  const normalizedLanguage = normalizeLanguage(language);
  const config = getLanguageConfig(normalizedLanguage);

  if (!config) {
    throw new UnsupportedLanguageError(normalizedLanguage);
  }

  if (config.usesLegacyRunner) {
    return runJavaScriptCode(code);
  }

  return runInContainer(code, config);
}