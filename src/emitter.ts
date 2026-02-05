import { EmitContext, NoTarget, resolvePath, DiagnosticSeverity } from "@typespec/compiler";
import { $onEmit as openApiOnEmit } from "@typespec/openapi3";
import { ConsumerOperation, ClientGenerationOptions, generateClient, parseGenerationLanguage, LogLevel } from "./kiota/index.js";

export type ClientOptions = Omit<ClientGenerationOptions, "openApiFilePath" | "operation" | "workingDirectory" | "language">;
export interface KiotaEmitterOptions {
  clients: Record<string, Partial<ClientOptions>>;
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any, // the any cast is needed because the versions is internal, remove when https://github.com/microsoft/typespec/pull/9584 is published
  });

  // check that the file was created
  // TODO we need to iterate over the namespaces if multiple OpenApi documents are emitted
  const openApiFilePath = resolvePath(context.emitterOutputDir, "openapi.json");
  const openApiFile = await context.program.host.readFile(openApiFilePath);
  if (!openApiFile) {
    throw new Error("OpenAPI file was not emitted, check the logs for errors.");
  }

  await Promise.all(Object.entries(context.options.clients).map(async ([clientLanguage, languageOptions]) => {
    const result = await generateClient({
      ...languageOptions,
      openAPIFilePath: "openapi.json",
      outputPath: languageOptions.outputPath ?? resolvePath(context.emitterOutputDir, "kiota-client"),
      operation: ConsumerOperation.Generate,
      workingDirectory: context.emitterOutputDir,
      clientClassName: languageOptions.clientClassName ?? "ApiClient",
      clientNamespaceName: languageOptions.clientNamespaceName ?? "ApiClientNamespace",
      language: parseGenerationLanguage(clientLanguage),
    });
    if (!result) {
      context.program.reportDiagnostic({
        code: "kiota-emitter-generation-failed",
        message: `Kiota client generation failed for language ${clientLanguage}.`,
        target: NoTarget,
        severity: "error",
      });
      return;
    }
    result.logs
    .filter(logEntry => logEntry.level === LogLevel.error || logEntry.level === LogLevel.warning)
    .forEach(logEntry => {
      context.program.reportDiagnostic({
        code: "kiota-emitter-log",
        message: logEntry.message,
        target: NoTarget,
        severity: mapKiotaLogLevelToDiagnosticSeverity(logEntry.level as LogLevel.error | LogLevel.warning),
      });
    });
  }));
}

function mapKiotaLogLevelToDiagnosticSeverity(level: LogLevel.error | LogLevel.warning): DiagnosticSeverity {
  switch (level) {
    case LogLevel.error:
      return "error";
    case LogLevel.warning:
      return "warning";
  }
}
