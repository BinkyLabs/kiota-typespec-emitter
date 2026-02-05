import { deepEqual, strictEqual } from "node:assert";
import { describe, it } from "node:test";
import { kebabToCamel, convertKebabToCamel } from "../src/utils/kebab-to-camel.js";

describe("kebab-to-camel utilities", () => {
  describe("kebabToCamel", () => {
    it("converts simple kebab-case to camelCase", () => {
      strictEqual(kebabToCamel("client-class-name"), "clientClassName");
    });

    it("converts multiple hyphens correctly", () => {
      strictEqual(kebabToCamel("client-namespace-name"), "clientNamespaceName");
    });

    it("handles single word without hyphens", () => {
      strictEqual(kebabToCamel("outputPath"), "outputPath");
    });

    it("converts output-path to outputPath", () => {
      strictEqual(kebabToCamel("output-path"), "outputPath");
    });

    it("converts clear-cache to clearCache", () => {
      strictEqual(kebabToCamel("clear-cache"), "clearCache");
    });

    it("converts clean-output to cleanOutput", () => {
      strictEqual(kebabToCamel("clean-output"), "cleanOutput");
    });

    it("converts include-additional-data to includeAdditionalData", () => {
      strictEqual(kebabToCamel("include-additional-data"), "includeAdditionalData");
    });

    it("converts uses-backing-store to usesBackingStore", () => {
      strictEqual(kebabToCamel("uses-backing-store"), "usesBackingStore");
    });

    it("converts exclude-backward-compatible to excludeBackwardCompatible", () => {
      strictEqual(kebabToCamel("exclude-backward-compatible"), "excludeBackwardCompatible");
    });

    it("converts disabled-validation-rules to disabledValidationRules", () => {
      strictEqual(kebabToCamel("disabled-validation-rules"), "disabledValidationRules");
    });

    it("converts exclude-patterns to excludePatterns", () => {
      strictEqual(kebabToCamel("exclude-patterns"), "excludePatterns");
    });

    it("converts include-patterns to includePatterns", () => {
      strictEqual(kebabToCamel("include-patterns"), "includePatterns");
    });

    it("converts structured-mime-types to structuredMimeTypes", () => {
      strictEqual(kebabToCamel("structured-mime-types"), "structuredMimeTypes");
    });
  });

  describe("convertKebabToCamel", () => {
    it("converts object with kebab-case keys to camelCase", () => {
      const input = {
        "client-class-name": "WidgetClient",
        "client-namespace-name": "DemoService.Client",
        "output-path": "out/csharp-client",
      };
      const expected = {
        clientClassName: "WidgetClient",
        clientNamespaceName: "DemoService.Client",
        outputPath: "out/csharp-client",
      };
      deepEqual(convertKebabToCamel(input), expected);
    });

    it("converts object with mixed kebab-case and camelCase keys", () => {
      const input = {
        "client-class-name": "WidgetClient",
        outputPath: "out/csharp-client",
        "clean-output": true,
      };
      const expected = {
        clientClassName: "WidgetClient",
        outputPath: "out/csharp-client",
        cleanOutput: true,
      };
      deepEqual(convertKebabToCamel(input), expected);
    });

    it("handles boolean and array values", () => {
      const input = {
        "clean-output": true,
        "clear-cache": false,
        deserializers: ["json", "xml"],
        "exclude-patterns": ["*/test/*"],
      };
      const expected = {
        cleanOutput: true,
        clearCache: false,
        deserializers: ["json", "xml"],
        excludePatterns: ["*/test/*"],
      };
      deepEqual(convertKebabToCamel(input), expected);
    });

    it("returns empty object for empty input", () => {
      deepEqual(convertKebabToCamel({}), {});
    });

    it("handles all client generation option properties", () => {
      const input = {
        "client-class-name": "ApiClient",
        "client-namespace-name": "ApiClientNamespace",
        "output-path": "kiota-client",
        "clear-cache": true,
        "clean-output": false,
        "include-additional-data": true,
        "uses-backing-store": false,
        "exclude-backward-compatible": false,
        "disabled-validation-rules": ["rule1"],
        "exclude-patterns": ["pattern1"],
        "include-patterns": ["pattern2"],
        deserializers: ["json"],
        serializers: ["json"],
        "structured-mime-types": ["application/json"],
      };
      const result = convertKebabToCamel(input);
      
      strictEqual(result.clientClassName, "ApiClient");
      strictEqual(result.clientNamespaceName, "ApiClientNamespace");
      strictEqual(result.outputPath, "kiota-client");
      strictEqual(result.clearCache, true);
      strictEqual(result.cleanOutput, false);
      strictEqual(result.includeAdditionalData, true);
      strictEqual(result.usesBackingStore, false);
      strictEqual(result.excludeBackwardCompatible, false);
      deepEqual(result.disabledValidationRules, ["rule1"]);
      deepEqual(result.excludePatterns, ["pattern1"]);
      deepEqual(result.includePatterns, ["pattern2"]);
      deepEqual(result.deserializers, ["json"]);
      deepEqual(result.serializers, ["json"]);
      deepEqual(result.structuredMimeTypes, ["application/json"]);
    });
  });
});
