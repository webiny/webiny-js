export default async options => {
    const { cwd } = options;

    // Must be a dynamic import — see rslibCompile.js for the reason.
    const { createRslib } = await import("@rslib/core");

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
            }
        }
    });

    await rslib.build({ watch: true });
};
