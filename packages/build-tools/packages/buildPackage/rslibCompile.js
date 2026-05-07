import path from "path";
import fs from "fs";
import { dirname } from "path";
import glob from "fast-glob";
import { createRslib } from "@rslib/core";
import { pluginReact } from "@rsbuild/plugin-react";

const COMPILE_EXTENSIONS = [".js", ".jsx", ".ts", ".tsx"];
const SKIP_EXTENSIONS = [".d.ts"];

const createRslibConfig = () => ({
    lib: [
        {
            format: "esm",
            bundle: false
        }
    ],
    source: {
        entry: ["./src/**/*.{ts,tsx,js,jsx}"],
        alias: { "~": "./src" }
    },
    output: {
        target: "web",
        distPath: { root: "./dist" },
        cleanDistPath: false,
        sourceMap: { js: "source-map" }
    },
    plugins: [pluginReact()]
});

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

    const rslib = await createRslib({
        cwd,
        config: createRslibConfig()
    });

    await rslib.build();
};
