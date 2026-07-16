import fs from "node:fs";
import { join } from "node:path";

export default async options => {
    const { cwd } = options;

    // Invalidate the build-cache freshness marker (see scripts/buildPackages
    // distBuildHash.ts, ".webiny-build-hash"). Watch writes into dist without
    // updating that marker, so its contents no longer match the last full
    // build — a later `yarn build` must restore/rebuild instead of trusting the
    // marker and skipping the cache→dist copy.
    fs.rmSync(join(cwd, "dist", ".webiny-build-hash"), { force: true });

    // Must be a dynamic import — see rslibCompile.js for the reason.
    const [{ createRslib }, { pluginSvgr }] = await Promise.all([
        import("@rslib/core"),
        import("@rsbuild/plugin-svgr")
    ]);

    const rslib = await createRslib({
        cwd,
        config: {
            lib: [{ format: "esm", bundle: false }],
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
            plugins: [pluginSvgr({ mixedImport: true, svgrOptions: { exportType: "named" } })]
        }
    });

    await rslib.build({ watch: true });
};
