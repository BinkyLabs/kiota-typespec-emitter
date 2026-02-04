import { createTypeSpecLibrary } from "@typespec/compiler";

export const $lib = createTypeSpecLibrary({
  name: "@binkylabs/kiota-typespec-emitter",
  diagnostics: {},
});

export const { reportDiagnostic, createDiagnostic } = $lib;
