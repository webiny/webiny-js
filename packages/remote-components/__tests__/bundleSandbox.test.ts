import { describe, it, expect } from "vitest";
import { createLongTextInput } from "@webiny/website-builder-sdk";
import {
    bundleComponent,
    buildComponentManifest,
    renderComponentMarkup,
    validateComponentBundle
} from "~/api/bundler/index.js";

const sourceWith = (moduleCode: string, body = "return <p>{inputs.title}</p>;") => `
${moduleCode}

export default function Probe({ inputs }) {
    ${body}
}

export const manifest = {
    name: "Test/Probe",
    label: LABEL,
    inputs: [
        { name: "title", factory: "createTextInput", params: { label: "Title" } }
    ]
};
`;

const bundleOf = async (source: string) => {
    const result = await bundleComponent({ name: "Test/Probe", source });
    return result.bundled;
};

// Puts `code` at the top of the bundle's `createComponent`, where the source's module-level code runs.
const injectModuleCode = (bundled: string, code: string) => {
    const anchor = "const { React, sdk } = runtime.dependencies;";
    expect(bundled).toContain(anchor);
    return bundled.replace(anchor, `${code}\n    ${anchor}`);
};

const PROBE_SOURCE = sourceWith('const LABEL = "Probe";');

describe("building a manifest from a bundle", () => {
    it("stops module-level code that doesn't finish", async () => {
        const bundled = injectModuleCode(await bundleOf(PROBE_SOURCE), "while (true) {}");
        const started = Date.now();

        await expect(buildComponentManifest(bundled, "Test/Probe")).rejects.toThrow(/timed out/);
        expect(Date.now() - started).toBeLessThan(5000);
    });

    it("stops promise jobs that don't finish", async () => {
        const bundled = injectModuleCode(
            await bundleOf(PROBE_SOURCE),
            "const spin = () => Promise.resolve().then(spin); spin();"
        );

        await expect(buildComponentManifest(bundled, "Test/Probe")).rejects.toThrow(/timed out/);
    });

    it("rejects a bundle that doesn't finish as an invalid bundle", async () => {
        const bundled = injectModuleCode(await bundleOf(PROBE_SOURCE), "while (true) {}");

        const result = await validateComponentBundle(
            { name: "Test/Probe", source: PROBE_SOURCE },
            { bundledJs: bundled, manifest: "{}" }
        );

        expect(result.valid).toBe(false);
        expect(result.errors[0]).toMatch(
            /^Could not build the manifest for "Test\/Probe": .*timed out/
        );
    });

    it("stops bundling a source whose module-level code doesn't finish", async () => {
        const source = sourceWith('const LABEL = "Probe";\nwhile (true) {}');

        await expect(bundleComponent({ name: "Test/Probe", source })).rejects.toThrow(/timed out/);
    });

    it("hands the bundle a runtime created inside its own context", async () => {
        // The label reports which realm the runtime object belongs to.
        const bundled = (await bundleOf(PROBE_SOURCE)).replace(
            "label: LABEL",
            'label: Object.getPrototypeOf(runtime) === Object.prototype ? "context" : "host"'
        );
        expect(bundled).toContain('"context" : "host"');

        const manifest = await buildComponentManifest(bundled, "Test/Probe");

        expect(manifest.label).toBe("context");
    });

    it("produces the same inputs the SDK factories produce", async () => {
        const source = sourceWith(
            'const LABEL = "Probe";',
            "return <p>{inputs.title}</p>;"
        ).replace(
            '{ name: "title", factory: "createTextInput", params: { label: "Title" } }',
            '{ name: "body", factory: "createLongTextInput", params: { label: "Body", onChange: value => value.trim() } }'
        );
        const bundled = await bundleOf(source);

        const manifest = await buildComponentManifest(bundled, "Test/Probe");

        const expected = createLongTextInput({
            name: "body",
            label: "Body",
            onChange: (value: string) => value.trim()
        });
        expect(manifest.inputs).toEqual([JSON.parse(JSON.stringify(expected))]);
    });

    it("validates its own bundle when the manifest holds values JSON drops", async () => {
        const source = sourceWith('const LABEL = "Probe";').replace(
            "    label: LABEL,",
            "    label: LABEL,\n    format: value => value,\n    hint: undefined,"
        );
        const result = await bundleComponent({ name: "Test/Probe", source });

        const validation = await validateComponentBundle(
            { name: "Test/Probe", source },
            { bundledJs: result.bundled, manifest: result.manifest }
        );

        expect(validation).toEqual({ valid: true, errors: [] });
    });
});

describe("rendering a bundle", () => {
    it("stops a render that doesn't finish", async () => {
        const bundled = await bundleOf(sourceWith('const LABEL = "Probe";', "while (true) {}"));
        // The manifest builds: the component function itself is what never returns.
        await expect(buildComponentManifest(bundled, "Test/Probe")).resolves.toBeDefined();
        const started = Date.now();

        await expect(renderComponentMarkup(bundled, "Test/Probe", [])).rejects.toThrow(
            /^Could not render "Test\/Probe": .*timed out/
        );
        expect(Date.now() - started).toBeLessThan(5000);
    });
});
