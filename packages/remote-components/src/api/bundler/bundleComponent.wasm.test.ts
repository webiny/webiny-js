import { describe, it, expect } from "vitest";
import { bundleComponent } from "./bundleComponent.js";

/**
 * Environment 2 of 3 for the wasm asset: local development. vitest runs against `src`, so this
 * exercises `new URL("./esbuild.wasm.gz", import.meta.url)` resolving next to the uncompiled module.
 *
 * The source follows the convention the generation prompt demonstrates — manifest last. Putting it
 * first silently strips the whole component; see the manifest-strip issue, which W2's conformance
 * test covers.
 */
describe("bundleComponent on the wasm asset", () => {
    it("bundles a component without any browser or node_modules resolution", async () => {
        const result = await bundleComponent({
            name: "Hero",
            source: [
                "const clamp = n => Math.max(0, n);",
                "",
                "export default function Hero({ inputs }) {",
                "    return <section><h1>{inputs.title}</h1><span>{clamp(inputs.count)}</span></section>;",
                "}",
                "",
                "export const manifest = {",
                '    name: "Custom/Hero",',
                '    label: "Hero",',
                "    inputs: [",
                '        { name: "title", factory: "createTextInput", params: { label: "Title" } }',
                "    ]",
                "};"
            ].join("\n")
        });

        expect(result.name).toBe("Hero");
        expect(result.bundled).toContain("__remoteComponent__");
        // JSX compiled away, and the module-scope helper carried along with the component.
        expect(result.bundled).not.toContain("<section>");
        expect(result.bundled).toContain("clamp");
        expect(result.sha256).toMatch(/^[0-9a-f]{64}$/);
    });
});
