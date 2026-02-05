import { resolvePath } from "@typespec/compiler";
import {
  createTestLibrary,
  TypeSpecTestLibrary,
} from "@typespec/compiler/testing";
import { fileURLToPath } from "node:url";

export const BinkylabsKiotaTypespecEmitterTestLibrary: TypeSpecTestLibrary =
  createTestLibrary({
    name: "@binkylabs/kiota-typespec-emitter",
    packageRoot: resolvePath(fileURLToPath(import.meta.url), "../../../../"),
  });
