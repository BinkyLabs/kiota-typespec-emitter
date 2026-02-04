import { resolvePath } from "@typespec/compiler";
import { createTestLibrary, TypeSpecTestLibrary } from "@typespec/compiler/testing";
import { fileURLToPath } from "url";

export const BinkylabsX2FKiotaTypespecEmitterTestLibrary: TypeSpecTestLibrary = createTestLibrary({
  name: "@binkylabs&#x2F;kiota-typespec-emitter",
  packageRoot: resolvePath(fileURLToPath(import.meta.url), "../../../../"),
});
