import { deepEqual, strictEqual } from "node:assert";
import { describe, it } from "node:test";
import { Tester } from "./test-host.js";

const baseServiceDefinition = 
`
  import "@typespec/http";

  using Http;
  @service(#{ title: "Widget Service" })
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
    const [, diagnostics] = await Tester.compileAndDiagnose(baseServiceDefinition);
    strictEqual(diagnostics.length, 1);
    strictEqual(diagnostics[0].code, "kiota-emitter-no-clients");
  });
  it("emit openapi.json", async () => {
    const [result, diagnostics] = await Tester.compileAndDiagnose(baseServiceDefinition, {
      compilerOptions: {
        options: {
          "@binkylabs/kiota-typespec-emitter": {
            clients: {
              csharp: {
                outputPath: "out/csharp-client",
                clientClassName: "WidgetClient",
                clientNamespaceName: "DemoService.Client",
              },
            },
          },
        },
      },
    });
    const openApiDescription = JSON.parse(result.outputs["openapi.json"]);
    strictEqual(openApiDescription.openapi, "3.2.0");

    const kiotaLogs = diagnostics.filter(d => d.code === "kiota-emitter-log");
    deepEqual(kiotaLogs, [], "Expected no Kiota logs, but got: " + JSON.stringify(kiotaLogs));

    const errorLogs = diagnostics.filter(d => d.code === "kiota-emitter-generation-failed");
    deepEqual(errorLogs, [], "Expected no Kiota generation errors, but got: " + JSON.stringify(errorLogs));
  });
});
