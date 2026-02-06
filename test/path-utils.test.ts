import { strictEqual } from "node:assert";
import { describe, it } from "node:test";
import { dirname } from "node:path";

/**
 * Test version of the getRootOutputFolder function
 */
function getRootOutputFolder(emitterDir: string): string {
  const parentDir = dirname(emitterDir);
  const grandparentDir = dirname(parentDir);
  // Check if parent directory is a scoped package (starts with @)
  const parentBasename = parentDir.substring(parentDir.lastIndexOf("/") + 1);
  const isScoped = parentBasename.startsWith("@");
  return isScoped ? grandparentDir : parentDir;
}

describe("getRootOutputFolder", () => {
  it("should extract root from scoped package path", () => {
    const input = "tsp-output/@binkylabs/kiota-typespec-emitter";
    const expected = "tsp-output";
    strictEqual(getRootOutputFolder(input), expected);
  });

  it("should extract root from unscoped package path", () => {
    const input = "tsp-output/some-package";
    const expected = "tsp-output";
    strictEqual(getRootOutputFolder(input), expected);
  });

  it("should handle absolute paths with scoped packages", () => {
    const input =
      "/home/user/project/tsp-output/@binkylabs/kiota-typespec-emitter";
    const expected = "/home/user/project/tsp-output";
    strictEqual(getRootOutputFolder(input), expected);
  });
});
