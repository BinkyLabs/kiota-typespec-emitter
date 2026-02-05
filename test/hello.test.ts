import { deepEqual, strictEqual } from "node:assert";
import { describe, it, before, after } from "node:test";
import { Tester } from "./test-host.js";
import { compile, NodeHost } from "@typespec/compiler";
import * as fs from "node:fs/promises";
import * as path from "node:path";

const baseServiceDefinition = `
  import "@typespec/http";

  using Http;
  @service(#{ title: "Widget Service" })
  @server("https://localhost:8989")
  namespace DemoService;

  model Widget {
    @visibility(Lifecycle.Read)
    id: string;

    weight: int32;
    color: "red" | "blue";
  }

  @error
  model Error {
    code: int32;
    message: string;
  }

  @route("/widgets")
  @tag("Widgets")
  interface Widgets {
    /** List widgets */
    @get list(): Widget[] | Error;

    /** Read widgets */
    @get read(@path id: Widget.id): Widget | Error;

    /** Create a widget */
    @post create(@body widget: Widget): Widget | Error;

    /** Update a widget */
    @patch update(@path id: Widget.id, @body widget: MergePatchUpdate<Widget>): Widget | Error;

    /** Delete a widget */
    @delete delete(@path id: Widget.id): void | Error;
    /** Analyze a widget */
    @route("{id}/analyze") @post analyze(@path id: Widget.id): string | Error;
  }

`;

describe("hello", () => {
  it("logs an error if no clients are configured", async () => {
    const [, diagnostics] = await Tester.compileAndDiagnose(
      baseServiceDefinition,
    );
    strictEqual(diagnostics.length, 1);
    strictEqual(diagnostics[0].code, "kiota-emitter-no-clients");
  });

  const tmpTspFileName = "temp-service.tsp";
  const tmpDirectory = "test-output";
  const tmpTspFilePath = path.join(tmpDirectory, tmpTspFileName);
  const openApiFilePath = path.join(
    tmpDirectory,
    "@binkylabs",
    "kiota-typespec-emitter",
    "openapi.json",
  );
  const clientFilePath = path.join(
    tmpDirectory,
    "@binkylabs",
    "kiota-typespec-emitter",
    "out",
    "csharp-client",
    "WidgetClient.cs",
  );
  before(async () => {
    await fs.mkdir(tmpDirectory, { recursive: true });
    await fs.writeFile(tmpTspFilePath, baseServiceDefinition);
  });
  after(async () => {
    await fs.rm(tmpDirectory, { recursive: true, force: true });
  });
  it("emit openapi.json with kebab-case configuration", async () => {
    // write the tsp to a temp file under this project
    const program = await compile(NodeHost, tmpTspFilePath, {
      options: {
        "@binkylabs/kiota-typespec-emitter": {
          clients: {
            csharp: {
              "output-path": "out/csharp-client",
              "client-class-name": "WidgetClient",
              "client-namespace-name": "DemoService.Client",
            },
          },
        },
      },
      emit: ["@binkylabs/kiota-typespec-emitter"],
      outputDir: tmpDirectory,
    });
    const diagnostics = program.diagnostics;
    const resultingOpenApiDescription = await fs.readFile(
      openApiFilePath,
      "utf-8",
    );
    strictEqual(
      !!resultingOpenApiDescription,
      true,
      "Expected openapi.json to be emitted.",
    );
    const openApiDescription = JSON.parse(resultingOpenApiDescription);
    strictEqual(openApiDescription.openapi, "3.2.0");

    const kiotaLogs = diagnostics.filter((d) => d.code === "kiota-emitter-log");
    deepEqual(
      kiotaLogs,
      [],
      "Expected no Kiota logs, but got: " + JSON.stringify(kiotaLogs),
    );

    const errorLogs = diagnostics.filter(
      (d) => d.code === "kiota-emitter-generation-failed",
    );
    deepEqual(
      errorLogs,
      [],
      "Expected no Kiota generation errors, but got: " +
        JSON.stringify(errorLogs),
    );

    await fs.access(clientFilePath);
  });

  it("emit openapi.json with additional kebab-case options", async () => {
    const additionalTmpTspFilePath = path.join(tmpDirectory, "additional-service.tsp");
    const additionalClientFilePath = path.join(
      tmpDirectory,
      "@binkylabs",
      "kiota-typespec-emitter",
      "out",
      "additional-client",
      "TestClient.cs",
    );
    
    await fs.writeFile(additionalTmpTspFilePath, baseServiceDefinition);
    
    const program = await compile(NodeHost, additionalTmpTspFilePath, {
      options: {
        "@binkylabs/kiota-typespec-emitter": {
          clients: {
            csharp: {
              "output-path": "out/additional-client",
              "client-class-name": "TestClient",
              "client-namespace-name": "Test.Client",
              "clean-output": true,
              "clear-cache": false,
              "include-additional-data": true,
              "uses-backing-store": false,
              "exclude-backward-compatible": false,
            },
          },
        },
      },
      emit: ["@binkylabs/kiota-typespec-emitter"],
      outputDir: tmpDirectory,
    });
    
    const diagnostics = program.diagnostics;
    const kiotaLogs = diagnostics.filter((d) => d.code === "kiota-emitter-log");
    deepEqual(
      kiotaLogs,
      [],
      "Expected no Kiota logs, but got: " + JSON.stringify(kiotaLogs),
    );

    const errorLogs = diagnostics.filter(
      (d) => d.code === "kiota-emitter-generation-failed",
    );
    deepEqual(
      errorLogs,
      [],
      "Expected no Kiota generation errors, but got: " +
        JSON.stringify(errorLogs),
    );

    await fs.access(additionalClientFilePath);
    await fs.unlink(additionalTmpTspFilePath);
  });

  it("backward compatibility: camelCase configuration still works", async () => {
    const backwardCompatTmpTspFilePath = path.join(tmpDirectory, "backward-compat-service.tsp");
    const backwardCompatClientFilePath = path.join(
      tmpDirectory,
      "@binkylabs",
      "kiota-typespec-emitter",
      "out",
      "backward-compat-client",
      "BackwardCompatClient.cs",
    );
    
    await fs.writeFile(backwardCompatTmpTspFilePath, baseServiceDefinition);
    
    const program = await compile(NodeHost, backwardCompatTmpTspFilePath, {
      options: {
        "@binkylabs/kiota-typespec-emitter": {
          clients: {
            csharp: {
              outputPath: "out/backward-compat-client",
              clientClassName: "BackwardCompatClient",
              clientNamespaceName: "BackwardCompat.Client",
              cleanOutput: true,
              clearCache: false,
              includeAdditionalData: true,
              usesBackingStore: false,
            },
          },
        },
      },
      emit: ["@binkylabs/kiota-typespec-emitter"],
      outputDir: tmpDirectory,
    });
    
    const diagnostics = program.diagnostics;
    const kiotaLogs = diagnostics.filter((d) => d.code === "kiota-emitter-log");
    deepEqual(
      kiotaLogs,
      [],
      "Expected no Kiota logs, but got: " + JSON.stringify(kiotaLogs),
    );

    const errorLogs = diagnostics.filter(
      (d) => d.code === "kiota-emitter-generation-failed",
    );
    deepEqual(
      errorLogs,
      [],
      "Expected no Kiota generation errors, but got: " +
        JSON.stringify(errorLogs),
    );

    await fs.access(backwardCompatClientFilePath);
    await fs.unlink(backwardCompatTmpTspFilePath);
  });
});
