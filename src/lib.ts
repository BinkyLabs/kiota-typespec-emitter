import { createTypeSpecLibrary, paramMessage } from "@typespec/compiler";

export const $lib = createTypeSpecLibrary({
  name: "@binkylabs/kiota-typespec-emitter",
  diagnostics: {
    "missing-options": {
      severity: "error",
      messages: {
        default:
          "Kiota Emitter options are missing. No clients will be generated.",
      },
    },
    "no-clients": {
      severity: "error",
      messages: {
        default:
          "No clients configured for generation in Kiota Emitter options.",
      },
    },
    "openapi-emit-failed": {
      severity: "error",
      messages: {
        default: "OpenAPI file was not emitted, check the logs for errors.",
      },
    },
    "generation-failed": {
      severity: "error",
      messages: {
        default: paramMessage`Kiota client generation failed for language ${"language"}.`,
      },
    },
    "kiota-error": {
      severity: "error",
      messages: {
        default: paramMessage`${"message"}`,
      },
    },
    "kiota-warning": {
      severity: "warning",
      messages: {
        default: paramMessage`${"message"}`,
      },
    },
  },
} as const);

export const { reportDiagnostic, createDiagnostic } = $lib;
