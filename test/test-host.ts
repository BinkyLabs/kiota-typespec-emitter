import { resolvePath } from "@typespec/compiler";
import { createTester } from "@typespec/compiler/testing";

export const Tester = createTester(resolvePath(import.meta.dirname, "../.."), {
  libraries: ["@typespec/http", "@binkylabs/kiota-typespec-emitter"],
})
.importLibraries()
.emit("@binkylabs/kiota-typespec-emitter");