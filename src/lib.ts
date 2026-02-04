import { createTypeSpecLibrary } from "@typespec/compiler";

export const $lib = createTypeSpecLibrary({
  name: "@binkylabs&#x2F;kiota-typespec-emitter",
  diagnostics: {},
});

export const { reportDiagnostic, createDiagnostic } = $lib;
