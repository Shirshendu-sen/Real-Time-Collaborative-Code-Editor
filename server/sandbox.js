import Docker from "dockerode";
import { createWriteStream } from "fs";
import { mkdtemp, rm, writeFile } from "fs/promises";
import { tmpdir } from "os";
import path from "path";
import { Writable } from "stream";

const docker = new Docker();
const TIMEOUT_MS = 5000;

function createCaptureStream(onChunk) {
  return new Writable({
    write(chunk, _encoding, callback) {
      onChunk(chunk.toString());
      callback();
    },
  });
}

export async function runUserCode(code) {
  const tempDir = await mkdtemp(path.join(tmpdir(), "code-sandbox-"));
  const codePath = path.join(tempDir, "main.js");
  let container;
  let timedOut = false;

  try {
    await writeFile(codePath, code, "utf8");

    container = await docker.createContainer({
      Image: "code-sandbox:latest",
      Cmd: ["node", "/sandbox/main.js"],
      AttachStdout: true,
      AttachStderr: true,
      Tty: false,
      HostConfig: {
        AutoRemove: true,
        Memory: 100 * 1024 * 1024,
        CpuQuota: 50000,
        CpuPeriod: 100000,
        NetworkMode: "none",
        PidsLimit: 64,
        Binds: [`${tempDir}:/sandbox:ro`],
      },
    });

    const stream = await container.attach({ stream: true, stdout: true, stderr: true });
    let stdout = "";
    let stderr = "";

    docker.modem.demuxStream(
      stream,
      createCaptureStream((chunk) => {
        stdout += chunk;
      }),
      createCaptureStream((chunk) => {
        stderr += chunk;
      }),
    );

    await container.start();

    const timeout = new Promise((resolve) => {
      setTimeout(async () => {
        timedOut = true;
        stderr += "Execution timed out after 5 seconds.\n";
        try {
          await container.kill();
        } catch (_error) {
          // AutoRemove may delete the container before kill completes.
        }
        resolve({ StatusCode: 124 });
      }, TIMEOUT_MS);
    });

    const result = await Promise.race([container.wait(), timeout]);

    return {
      stdout,
      stderr,
      exitCode: result.StatusCode,
      timedOut,
    };
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
}