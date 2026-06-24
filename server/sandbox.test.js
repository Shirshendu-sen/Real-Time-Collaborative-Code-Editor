import { describe, expect, it } from "vitest";
import { runUserCode } from "./sandbox.js";

describe("runUserCode", () => {
  it("executes simple code and returns stdout", async () => {
    const result = await runUserCode('console.log("hello")');

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain("hello");
    expect(result.stderr).toBe("");
    expect(result.timedOut).toBe(false);
  }, 10000);

  it(
    "kills code that runs too long",
    async () => {
      const result = await runUserCode("while(true) {}");

      expect(result.exitCode).toBe(124);
      expect(result.timedOut).toBe(true);
      expect(result.stderr).toContain("Execution timed out");
    },
    15000,
  );
});