import { Diagnostic, resolvePath } from "@typespec/compiler";
import {
  createTestHost,
  createTestWrapper,
  expectDiagnosticEmpty,
} from "@typespec/compiler/testing";
import { BinkylabsX2FKiotaTypespecEmitterTestLibrary } from "../src/testing/index.js";

export async function createBinkylabsX2FKiotaTypespecEmitterTestHost() {
  return createTestHost({
    libraries: [BinkylabsX2FKiotaTypespecEmitterTestLibrary],
  });
}

export async function createBinkylabsX2FKiotaTypespecEmitterTestRunner() {
  const host = await createBinkylabsX2FKiotaTypespecEmitterTestHost();

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
  const runner = await createBinkylabsX2FKiotaTypespecEmitterTestRunner();
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
