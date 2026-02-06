import { createTypeSpecLibrary, JSONSchemaType } from "@typespec/compiler";

/**
 * Options for generating a Kiota client for a specific language.
 * All properties use kebab-case for consistency with TypeSpec conventions.
 */
export interface KiotaClientOptions {
  /**
   * The output path where the generated client code will be written.
   * This path is relative to the emitter output directory.
   * @default "kiota-client"
   */
  "output-path"?: string;

  /**
   * The name of the client class to generate.
   * @default "ApiClient"
   */
  "client-class-name"?: string;

  /**
   * The namespace name for the generated client.
   * @default "ApiClientNamespace"
   */
  "client-namespace-name"?: string;

  /**
   * List of deserializer modules to include.
   */
  deserializers?: string[];

  /**
   * List of validation rules to disable during generation.
   */
  "disabled-validation-rules"?: string[];

  /**
   * Whether to exclude backward-compatible changes.
   * @default false
   */
  "exclude-backward-compatible"?: boolean;

  /**
   * Patterns to exclude from generation (glob patterns).
   */
  "exclude-patterns"?: string[];

  /**
   * Whether to include additional data in the generated client.
   * @default false
   */
  "include-additional-data"?: boolean;

  /**
   * Patterns to include in generation (glob patterns).
   */
  "include-patterns"?: string[];

  /**
   * Whether to clear the cache before generating the client.
   * @default false
   */
  "clear-cache"?: boolean;

  /**
   * Whether to clean the output directory before generating the client.
   * @default false
   */
  "clean-output"?: boolean;

  /**
   * List of serializer modules to include.
   */
  serializers?: string[];

  /**
   * List of structured MIME types to support.
   */
  "structured-mime-types"?: string[];

  /**
   * Whether the generated client uses a backing store.
   * @default false
   */
  "uses-backing-store"?: boolean;
}

/**
 * Configuration options for the Kiota TypeSpec emitter.
 */
export interface KiotaEmitterOptions {
  /**
   * A map of language names to client generation options.
   * The key is the target language (e.g., "csharp", "typescript", "python", "java", "go", "php").
   * The value is the configuration for generating a client in that language.
   *
   * @example
   * ```yaml
   * clients:
   *   csharp:
   *     output-path: "out/csharp-client"
   *     client-class-name: "WidgetClient"
   *     client-namespace-name: "DemoService.Client"
   *     clean-output: true
   *   typescript:
   *     output-path: "out/ts-client"
   *     client-class-name: "WidgetClient"
   * ```
   */
  clients?: Record<string, KiotaClientOptions>;
}

const EmitterOptionsSchema: JSONSchemaType<KiotaEmitterOptions> = {
  type: "object",
  additionalProperties: false,
  properties: {
    clients: {
      type: "object",
      nullable: true,
      description:
        "A map of language names to client generation options. The key is the target language (e.g., 'csharp', 'typescript', 'python', 'java', 'go', 'php').",
      required: [],
      additionalProperties: {
        type: "object",
        properties: {
          "output-path": {
            type: "string",
            nullable: true,
            description:
              "The output path where the generated client code will be written. This path is relative to the emitter output directory. Default: 'kiota-client'",
          },
          "client-class-name": {
            type: "string",
            nullable: true,
            description:
              "The name of the client class to generate. Default: 'ApiClient'",
          },
          "client-namespace-name": {
            type: "string",
            nullable: true,
            description:
              "The namespace name for the generated client. Default: 'ApiClientNamespace'",
          },
          deserializers: {
            type: "array",
            items: { type: "string" },
            nullable: true,
            description: "List of deserializer modules to include.",
          },
          "disabled-validation-rules": {
            type: "array",
            items: { type: "string" },
            nullable: true,
            description:
              "List of validation rules to disable during generation.",
          },
          "exclude-backward-compatible": {
            type: "boolean",
            nullable: true,
            description:
              "Whether to exclude backward-compatible changes. Default: false",
          },
          "exclude-patterns": {
            type: "array",
            items: { type: "string" },
            nullable: true,
            description: "Patterns to exclude from generation (glob patterns).",
          },
          "include-additional-data": {
            type: "boolean",
            nullable: true,
            description:
              "Whether to include additional data in the generated client. Default: false",
          },
          "include-patterns": {
            type: "array",
            items: { type: "string" },
            nullable: true,
            description: "Patterns to include in generation (glob patterns).",
          },
          "clear-cache": {
            type: "boolean",
            nullable: true,
            description:
              "Whether to clear the cache before generating the client. Default: false",
          },
          "clean-output": {
            type: "boolean",
            nullable: true,
            description:
              "Whether to clean the output directory before generating the client. Default: false",
          },
          serializers: {
            type: "array",
            items: { type: "string" },
            nullable: true,
            description: "List of serializer modules to include.",
          },
          "structured-mime-types": {
            type: "array",
            items: { type: "string" },
            nullable: true,
            description: "List of structured MIME types to support.",
          },
          "uses-backing-store": {
            type: "boolean",
            nullable: true,
            description:
              "Whether the generated client uses a backing store. Default: false",
          },
        },
        required: [],
        // TypeScript's JSONSchemaType doesn't fully support Record types with additionalProperties.
        // This cast is necessary and follows the pattern used in official TypeSpec emitters.
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any,
      // TypeScript's JSONSchemaType doesn't fully support Record types.
      // This cast is necessary and follows the pattern used in official TypeSpec emitters.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any,
  },
  required: [],
};

export const $lib = createTypeSpecLibrary({
  name: "@binkylabs/kiota-typespec-emitter",
  diagnostics: {},
  emitter: {
    options: EmitterOptionsSchema as JSONSchemaType<KiotaEmitterOptions>,
  },
});

export const { reportDiagnostic, createDiagnostic } = $lib;
