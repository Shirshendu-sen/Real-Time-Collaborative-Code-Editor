import Docker from "dockerode";
import { mkdtemp, rm, writeFile } from "fs/promises";
import { tmpdir } from "os";
import path from "path";
import { runUserCode as runJavaScriptCode } from "../sandbox.js";
import { DEFAULT_LANGUAGE, getLanguageConfig, normalizeLanguage } from "./languages.js";

const docker = new Docker();
const DEFAULT_TIMEOUT_MS = 5000;
const DEFAULT_MEMORY_MB = 100;
const DEFAULT_PIDS_LIMIT = 64;
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
  const timeoutMs = config.timeoutMs || DEFAULT_TIMEOUT_MS;
  const memoryBytes = (config.memoryMb || DEFAULT_MEMORY_MB) * 1024 * 1024;
  const pidsLimit = config.pidsLimit || DEFAULT_PIDS_LIMIT;
  let container;
  let timedOut = false;
  let timeoutId;

  try {
    await writeFile(codePath, code, "utf8");

    const createOptions = {
      Image: config.image,
      Cmd: ["sh", "-c", buildShellCommand(config)],
      AttachStdout: true,
      AttachStderr: true,
      Tty: false,
      WorkingDir: "/sandbox",
      HostConfig: {
        AutoRemove: false,
        Memory: memoryBytes,
        CpuQuota: 100000,
        CpuPeriod: 100000,
        NetworkMode: "none",
        PidsLimit: pidsLimit,
        Binds: [`${tempDir}:/sandbox:ro`],
      },
    };

    if (config.env) {
      createOptions.Env = config.env;
    }

    container = await docker.createContainer(createOptions);

    await container.start();

    let timeoutMessage = "";
    const timeoutSeconds = Math.round(timeoutMs / 1000);

    const timeout = new Promise((resolve) => {
      timeoutId = setTimeout(() => {
        timedOut = true;
        timeoutMessage = `Execution timed out after ${timeoutSeconds} seconds.\n`;
        container.kill().catch(() => {});
        resolve({ StatusCode: 124 });
      }, timeoutMs);
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