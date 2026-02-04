import { Diagnostic, resolvePath } from "@typespec/compiler";
import {
  createTestHost,
  createTestWrapper,
  expectDiagnosticEmpty,
} from "@typespec/compiler/testing";
import { BinkylabsKiotaTypespecEmitterTestLibrary } from "../src/testing/index.js";

export async function createBinkylabsKiotaTypespecEmitterTestHost() {
  return createTestHost({
    libraries: [BinkylabsKiotaTypespecEmitterTestLibrary],
  });
}

export async function createBinkylabsKiotaTypespecEmitterTestRunner() {
  const host = await createBinkylabsKiotaTypespecEmitterTestHost();

  return createTestWrapper(host, {
    compilerOptions: {
      noEmit: false,
      emit: ["@binkylabs/kiota-typespec-emitter"],
    },
  });
}

export async function emitWithDiagnostics(
  code: string
): Promise<[Record<string, string>, readonly Diagnostic[]]> {
  const runner = await createBinkylabsKiotaTypespecEmitterTestRunner();
  await runner.compileAndDiagnose(code, {
    outputDir: "tsp-output",
  });
  const emitterOutputDir = "./tsp-output/@binkylabs/kiota-typespec-emitter";
  const files = await runner.program.host.readDir(emitterOutputDir);

  const result: Record<string, string> = {};
  for (const file of files) {
    result[file] = (await runner.program.host.readFile(resolvePath(emitterOutputDir, file))).text;
  }
  return [result, runner.program.diagnostics];
}

export async function emit(code: string): Promise<Record<string, string>> {
  const [result, diagnostics] = await emitWithDiagnostics(code);
  expectDiagnosticEmpty(diagnostics);
  return result;
}
