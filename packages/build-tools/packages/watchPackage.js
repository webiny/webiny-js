export default async options => {
    const { cwd } = options;

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
