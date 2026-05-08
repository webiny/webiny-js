import path from "path";
import fs from "fs";
import { dirname } from "path";
import glob from "fast-glob";

const COMPILE_EXTENSIONS = [".js", ".jsx", ".ts", ".tsx", ".svg"];
const SKIP_EXTENSIONS = [".d.ts"];

export const rslibCompile = async ({ cwd }) => {
    // Copy non-compilable files (assets, json, graphql, etc.) as-is.
    const pattern = path.join(cwd, "src/**/*.*").replace(/\\/g, "/");
    const allFiles = glob.sync(pattern, { onlyFiles: true, dot: true });

    for (const file of allFiles) {
        const shouldCompile = COMPILE_EXTENSIONS.some(ext => file.endsWith(ext));
        const shouldSkip = SKIP_EXTENSIONS.some(ext => file.endsWith(ext));

        if (!shouldCompile || shouldSkip) {
            const destPath = file.replace(path.join(cwd, "src"), path.join(cwd, "dist"));
            fs.mkdirSync(dirname(destPath), { recursive: true });
            fs.copyFileSync(file, destPath);
        }
    }

    // Must be a dynamic import. @rslib/core statically loads rspack's native
    // binding. Workers that also run createBuildAdmin load a different rspack
    // version via rsbuild, so two native binaries end up in the same process
    // and cause a SIGSEGV. Deferring the import keeps each rspack isolated to
    // the workers that actually need it.
    const [{ createRslib }, { pluginSvgr }] = await Promise.all([
        import("@rslib/core"),
        import("@rsbuild/plugin-svgr")
    ]);

    const rslib = await createRslib({
        cwd,
        config: {
            lib: [{ format: "esm", bundle: false }],
            source: {
                // SVGs included so rslib runs them through pluginSvgr and emits
                // a .js React-component module alongside the copied .svg asset.
                entry: ["./src/**/*.{ts,tsx,js,jsx,svg}"],
                alias: { "~": "./src" }
            },
            output: {
                target: "web",
                distPath: { root: "./dist" },
                cleanDistPath: false,
                sourceMap: { js: "source-map" }
            },
            plugins: [pluginSvgr({ svgrOptions: { exportType: "named" } })]
        }
    });

    const { close } = await rslib.build();
    await close();
};
