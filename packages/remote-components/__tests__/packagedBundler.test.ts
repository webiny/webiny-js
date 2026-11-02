import { describe, it, expect, beforeAll, afterAll } from "vitest";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";

/*
 * The API runs bundled, without `node_modules`, so the bundler only works deployed if the wasm asset
 * travels with the bundle. This builds a function that imports the bundler from the built package,
 * with the same rsbuild config the API uses, copies the output somewhere with no `node_modules`
 * above it, and bundles a component there.
 *
 * It needs the package built (`yarn build -p @webiny/remote-components`), like any test that imports
 * a workspace package. The function's source sits under the root `node_modules/.cache`, outside this
 * package: inside it, `@webiny/remote-components` would resolve to the package's own source tree.
 */
const ROOT = path.resolve(import.meta.dirname, "../../..");
const FUNCTION_DIR = path.join(ROOT, "node_modules/.cache/remote-components-packaged-bundler");

const ENTRY = `import { bundleComponent } from "@webiny/remote-components/api/bundler/bundleComponent.js";

export const handler = async (event: { name: string; source: string; css?: string }) => {
    return bundleComponent(event);
};
`;

const TSCONFIG = {
    compilerOptions: {
        target: "ES2022",
        module: "ESNext",
        moduleResolution: "Bundler",
        strict: true,
        skipLibCheck: true,
        noEmit: true
    },
    include: ["src"]
};

const SOURCE = `
export default function Card({ inputs: { title } }) {
    return <h3 className="card-title">{title}</h3>;
}

export const manifest = {
    name: "Test/Card",
    label: "Card",
    inputs: [
        { name: "title", factory: "createTextInput", params: { label: "Title" } }
    ]
};
`;

let deployedDir: string;

beforeAll(async () => {
    fs.rmSync(FUNCTION_DIR, { recursive: true, force: true });
    fs.mkdirSync(path.join(FUNCTION_DIR, "src"), { recursive: true });
    fs.writeFileSync(path.join(FUNCTION_DIR, "src/index.ts"), ENTRY);
    fs.writeFileSync(path.join(FUNCTION_DIR, "tsconfig.json"), JSON.stringify(TSCONFIG));

    const nodeEnv = process.env.NODE_ENV;
    try {
        const { createBuildFunction } =
            await import("@webiny/build-tools/bundling/function/createBuildFunction.js");
        await createBuildFunction()({ cwd: FUNCTION_DIR });
    } finally {
        process.env.NODE_ENV = nodeEnv;
    }

    deployedDir = fs.mkdtempSync(path.join(os.tmpdir(), "remote-components-packaged-"));
    fs.cpSync(path.join(FUNCTION_DIR, "build"), deployedDir, { recursive: true });
}, 120_000);

afterAll(() => {
    fs.rmSync(FUNCTION_DIR, { recursive: true, force: true });
    if (deployedDir) {
        fs.rmSync(deployedDir, { recursive: true, force: true });
    }
});

describe("bundleComponent in a bundled function", () => {
    it("emits the gzipped wasm as an asset of the function bundle", () => {
        const assets = fs.readdirSync(path.join(deployedDir, "static/assets"));

        expect(assets).toEqual([expect.stringMatching(/^esbuild\.wasm\.[0-9a-f]+\.gz$/)]);
    });

    it("bundles a component with no node_modules to resolve from", () => {
        // A separate Node process running a file, as on Lambda. Not vitest's module runner, which
        // would load the function's chunks itself, and not `node --eval`, which exposes Node's `fs`
        // as a global that esbuild's in-process runtime then writes its protocol to.
        const runner = path.join(deployedDir, "run.mjs");
        fs.writeFileSync(
            runner,
            [
                'const { handler } = await import("./handler.mjs");',
                "const result = await handler(JSON.parse(process.argv[2]));",
                "process.stdout.write(JSON.stringify(result));"
            ].join("\n")
        );
        const event = JSON.stringify({ name: "Test/Card", source: SOURCE });
        const output = execFileSync(process.execPath, [runner, event], { encoding: "utf8" });
        const result = JSON.parse(output);

        expect(result.bundled).toContain("__remoteComponent__");
        expect(result.sha256).toMatch(/^[0-9a-f]{64}$/);
        expect(JSON.parse(result.manifest)).toMatchObject({
            name: "Test/Card",
            inputs: [{ name: "title", type: "text" }]
        });
    });
});
