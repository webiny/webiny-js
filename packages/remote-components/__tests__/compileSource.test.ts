import { describe } from "vitest";
import { it } from "vitest";
import { expect } from "vitest";
import { compileSource } from "~/api/bundler/compileSource.js";

// Its own file, so esbuild starts uninitialized and these compiles race for the first initialize.
describe("compileSource", () => {
    it("compiles concurrently from a cold start", async () => {
        const compile = (value: number) => {
            return compileSource({
                contents: `export default ${value};`,
                loader: "tsx",
                globalName: "__test__"
            });
        };

        const outputs = await Promise.all([compile(1), compile(2), compile(3)]);

        expect(outputs).toHaveLength(3);
        expect(outputs[2]).toContain("3");
    });
});
