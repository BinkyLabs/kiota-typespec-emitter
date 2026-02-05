import { EmitContext, emitFile, resolvePath } from "@typespec/compiler";
import { $onEmit as openApiOnEmit } from "@typespec/openapi3";
// import { ConsumerOperation, generateClient, KiotaGenerationLanguage } from "@microsoft/kiota";
import { ConsumerOperation, generateClient, KiotaGenerationLanguage } from "./kiota/index.js";

export async function $onEmit(context: EmitContext) {
  await emitFile(context.program, {
    path: resolvePath(context.emitterOutputDir, "output.txt"),
    content: "Hello world\n",
  });
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
  const openApiFilePath = resolvePath(context.emitterOutputDir, "openapi.json");
  const openApiFile = await context.program.host.readFile(openApiFilePath);
  if (!openApiFile) {
    throw new Error("OpenAPI file was not emitted, check the logs for errors.");
  }

  await generateClient({
    openAPIFilePath: openApiFilePath,
    outputPath: resolvePath(context.emitterOutputDir, "kiota-client"),
    clientClassName: "KiotaClient",
    language: KiotaGenerationLanguage.CSharp,
    clientNamespaceName: "KiotaGeneratedClient",
    operation: ConsumerOperation.Generate,
    workingDirectory: context.emitterOutputDir,
  });
}
