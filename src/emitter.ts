import { EmitContext, NoTarget, resolvePath } from "@typespec/compiler";
import { $onEmit as openApiOnEmit } from "@typespec/openapi3";
import {
  ConsumerOperation,
  ClientGenerationOptions,
  generateClient,
  parseGenerationLanguage,
  LogLevel,
} from "./kiota/index.js";
import { convertKebabToCamel } from "./utils/kebab-to-camel.js";
import { dirname } from "node:path";
import { reportDiagnostic } from "./lib.js";
import { KiotaEmitterOptions } from "./lib.js";

export type ClientOptions = Omit<
  ClientGenerationOptions,
  "openApiFilePath" | "operation" | "workingDirectory" | "language"
>;

/**
 * Extracts the root output folder from the emitter-specific directory path.
 * TypeSpec emitters receive paths like "tsp-output/@scope/package-name",
 * but we want to output to "tsp-output" directly.
 */
function getRootOutputFolder(emitterDir: string): string {
  const parentDir = dirname(emitterDir);
  const grandparentDir = dirname(parentDir);
  // Check if parent directory is a scoped package (starts with @)
  const parentBasename = parentDir.substring(parentDir.lastIndexOf("/") + 1);
  const isScoped = parentBasename.startsWith("@");
  return isScoped ? grandparentDir : parentDir;
}

export async function $onEmit(context: EmitContext<KiotaEmitterOptions>) {
  if (!context.options) {
    reportDiagnostic(context.program, {
      code: "missing-options",
      target: NoTarget,
    });
    return;
  }
  if (
    !context.options.clients ||
    Object.keys(context.options.clients).length === 0
  ) {
    reportDiagnostic(context.program, {
      code: "no-clients",
      target: NoTarget,
    });
    return;
  }

  const rootOutput = getRootOutputFolder(context.emitterOutputDir);

  // create the directory if it doesn't exist
  // Override the emitterOutputDir in the context to point to root output
  await openApiOnEmit({
    ...context,
    emitterOutputDir: rootOutput,
    options: {
      "file-type": "json",
      "omit-unreachable-types": true,
      "openapi-versions": ["3.2.0"],
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any, // the any cast is needed because the versions is internal, remove when https://github.com/microsoft/typespec/pull/9584 is published
  });

  // check that the file was created
  // Check for multiple service files first (openapi.{ServiceName}.json pattern)
  const files = await context.program.host.readDir(rootOutput);
  const openApiPattern = /^openapi\.(.+)\.json$/;
  const openApiFiles: { fileName: string; serviceName: string | null }[] = [];

  // Find all files matching the multiple services pattern
  for (const file of files) {
    const match = file.match(openApiPattern);
    if (match) {
      openApiFiles.push({
        fileName: file,
        serviceName: match[1],
      });
    }
  }

  // If no multiple service files found, try single openapi.json
  if (openApiFiles.length === 0) {
    const singleOpenApiFilePath = resolvePath(rootOutput, "openapi.json");
    const singleOpenApiFile = await context.program.host.readFile(
      singleOpenApiFilePath,
    );
    if (singleOpenApiFile) {
      // Single service case
      openApiFiles.push({ fileName: "openapi.json", serviceName: null });
    } else {
      reportDiagnostic(context.program, {
        code: "openapi-emit-failed",
        target: NoTarget,
      });
      return;
    }
  }

  // Generate clients for each OpenAPI file and each language
  await Promise.all(
    openApiFiles.flatMap((openApiFile) =>
      Object.entries(context.options.clients).map(
        async ([clientLanguage, languageOptions]) => {
          // Convert kebab-case keys to camelCase for internal processing
          const normalizedOptions = convertKebabToCamel(
            languageOptions as Record<string, unknown>,
          ) as Partial<ClientOptions>;

          // Kiota interprets outputPath relative to workingDirectory
          const baseOutputPath = normalizedOptions.outputPath ?? "kiota-client";
          // For multiple services, append the service name to the output path
          const kiotaOutputPath = openApiFile.serviceName
            ? `${baseOutputPath}/${openApiFile.serviceName.toLowerCase()}-client`
            : baseOutputPath;

          const result = await generateClient({
            ...normalizedOptions,
            openAPIFilePath: openApiFile.fileName,
            outputPath: kiotaOutputPath,
            operation: ConsumerOperation.Generate,
            workingDirectory: rootOutput,
            clientClassName: normalizedOptions.clientClassName ?? "ApiClient",
            clientNamespaceName:
              normalizedOptions.clientNamespaceName ?? "ApiClientNamespace",
            language: parseGenerationLanguage(clientLanguage),
          });
          if (!result) {
            const serviceDesc = openApiFile.serviceName
              ? `service ${openApiFile.serviceName}`
              : `single service (${openApiFile.fileName})`;
            reportDiagnostic(context.program, {
              code: "generation-failed",
              format: { language: clientLanguage, service: serviceDesc },
              target: NoTarget,
            });
            return;
          }
          result.logs
            .filter(
              (logEntry) =>
                logEntry.level === LogLevel.error ||
                logEntry.level === LogLevel.warning,
            )
            .forEach((logEntry) => {
              const code =
              logEntry.level === LogLevel.error
                ? "kiota-error"
                : "kiota-warning";
              reportDiagnostic(context.program, {
                code,
                format: { message: logEntry.message },
                target: NoTarget,
              });
          });
        },
      ),
    ),
  );
}
