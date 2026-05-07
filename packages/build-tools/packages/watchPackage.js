import { createRslib } from "@rslib/core";
import { pluginReact } from "@rsbuild/plugin-react";

export default async options => {
    const { cwd } = options;

    const rslib = await createRslib({
        cwd,
        config: {
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
        }
    });

    await rslib.build({ watch: true });
};
