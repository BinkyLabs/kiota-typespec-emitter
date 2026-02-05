import { strictEqual } from "node:assert";
import { describe, it, before, after } from "node:test";
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

describe("output path handling", () => {
  const tmpTspFileName = "temp-service.tsp";
  const tmpDirectory = "test-output-path";

  before(async () => {
    await fs.mkdir(tmpDirectory, { recursive: true });
  });

  after(async () => {
    await fs.rm(tmpDirectory, { recursive: true, force: true });
  });

  it("should output openapi.json to configured outputPath without package name", async () => {
    const tmpTspFilePath = path.join(tmpDirectory, tmpTspFileName);
    await fs.writeFile(tmpTspFilePath, baseServiceDefinition);

    // The openapi.json should be at tsp-output/openapi.json, not tsp-output/@binkylabs/kiota-typespec-emitter/openapi.json
    const expectedOpenApiFilePath = path.join(tmpDirectory, "openapi.json");

    await compile(NodeHost, tmpTspFilePath, {
      options: {
        "@binkylabs/kiota-typespec-emitter": {
          clients: {
            csharp: {
              outputPath: "kiota-clients/generated",
              clientClassName: "WidgetClient",
              clientNamespaceName: "DemoService.Client",
            },
          },
        },
      },
      emit: ["@binkylabs/kiota-typespec-emitter"],
      outputDir: tmpDirectory,
    });

    // Verify that openapi.json exists at the expected path
    await fs.access(expectedOpenApiFilePath);
    const openApiContent = await fs.readFile(expectedOpenApiFilePath, "utf-8");
    const openApiDescription = JSON.parse(openApiContent);
    strictEqual(openApiDescription.openapi, "3.2.0");
  });

  it("should output client to configured outputPath without package name", async () => {
    const tmpTspFilePath = path.join(tmpDirectory, tmpTspFileName + ".2");
    await fs.writeFile(tmpTspFilePath, baseServiceDefinition);

    // The client should be at tsp-output/kiota-clients/generated, not tsp-output/@binkylabs/kiota-typespec-emitter/kiota-clients/generated
    const expectedClientFilePath = path.join(
      tmpDirectory,
      "kiota-clients",
      "generated",
      "WidgetClient.cs",
    );

    await compile(NodeHost, tmpTspFilePath, {
      options: {
        "@binkylabs/kiota-typespec-emitter": {
          clients: {
            csharp: {
              outputPath: "kiota-clients/generated",
              clientClassName: "WidgetClient",
              clientNamespaceName: "DemoService.Client",
            },
          },
        },
      },
      emit: ["@binkylabs/kiota-typespec-emitter"],
      outputDir: tmpDirectory,
    });

    // Verify that the client exists at the expected path
    await fs.access(expectedClientFilePath);
  });
});
