import { EmitContext, NoTarget, resolvePath } from "@typespec/compiler";
import { $onEmit as openApiOnEmit } from "@typespec/openapi3";
// import { ConsumerOperation, ClientGenerationOptions, generateClient, KiotaGenerationLanguage, parseGenerationLanguage } from "@microsoft/kiota";
import { ConsumerOperation, ClientGenerationOptions, generateClient, KiotaGenerationLanguage, parseGenerationLanguage } from "./kiota/index.js";

export interface ClientOptions extends Exclude<ClientGenerationOptions, "openApiFilePath" | "operation" | "workingDirectory" | "language"> {

}
export interface KiotaEmitterOptions {
  clients: Record<KiotaGenerationLanguage, Partial<ClientOptions>>;
}

export async function $onEmit(context: EmitContext<KiotaEmitterOptions>) {
  if (!context.options) {
    // log an error diagnostic
    context.program.reportDiagnostic({
      code: "kiota-emitter-missing-options",
      message: "Kiota Emitter options are missing. No clients will be generated.",
      target: NoTarget,
      severity: "error",
    });
    return;
  }
  if (!context.options.clients || Object.keys(context.options.clients).length === 0) {
    // log an error diagnostic
    context.program.reportDiagnostic({
      code: "kiota-emitter-no-clients",
      message: "No clients configured for generation in Kiota Emitter options.",
      target: NoTarget,
      severity: "error",
    });
    return;
  }
  // create the directory if it doesn't exist
  await openApiOnEmit({
    ...context,
    options: {
      "file-type": "json",
      "omit-unreachable-types": true,
      "openapi-versions": ["3.2.0"],
    } as any, // the any cast is needed because the versions is internal, remove when https://github.com/microsoft/typespec/pull/9584 is published
  });

  // check that the file was created
  // TODO we need to iterate over the namespaces if multiple OpenApi documents are emitted
  const openApiFilePath = resolvePath(context.emitterOutputDir, "openapi.json");
  const openApiFile = await context.program.host.readFile(openApiFilePath);
  if (!openApiFile) {
    throw new Error("OpenAPI file was not emitted, check the logs for errors.");
  }

  const languages = Object.keys(context.options.clients).map(lang => parseGenerationLanguage(lang));

  languages.forEach(async clientLanguage => {
    const languageOptions = context.options.clients[clientLanguage];
    await generateClient({
      ...languageOptions,
      openAPIFilePath: openApiFilePath,
      outputPath: languageOptions.outputPath ?? resolvePath(context.emitterOutputDir, "kiota-client"),
      operation: ConsumerOperation.Generate,
      workingDirectory: context.emitterOutputDir,
      clientClassName: languageOptions.clientClassName ?? "ApiClient",
      clientNamespaceName: languageOptions.clientNamespaceName ?? "ApiClientNamespace",
      language: clientLanguage,
    });
  });
}
