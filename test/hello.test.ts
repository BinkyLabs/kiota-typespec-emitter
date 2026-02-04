import { strictEqual } from "node:assert";
import { describe, it } from "node:test";
import { emit } from "./test-host.js";

describe("hello", () => {
  it("emit output.txt with content hello world", async () => {
    const results = await emit(`op test(): void;`);
    strictEqual(results["output.txt"], "Hello world\n");
  });
  it("emit openapi.json", async () => {
    const results = await emit(`op test(): void;`);
    const openApiDescription = JSON.parse(results["openapi.json"]);
    strictEqual(openApiDescription.openapi, "3.2.0");
  });
});
