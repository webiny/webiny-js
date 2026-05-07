import { createRsbuildConfig } from "./createRsbuildConfig.js";

export const createWatchAdmin =
    () =>
    async ({ cwd }) => {
        process.env.NODE_ENV = "development";

        // Lazy import: @rsbuild/core transitively loads @rspack/core, which uses
        // import.meta.dirname at module top level. tsx's CJS transformer (used by
        // .babelrc.js files) can't handle that, so we defer the import until here.
        const { createRsbuild } = await import("@rsbuild/core");
        const rsbuildConfig = createRsbuildConfig({ cwd });

        const rsbuild = await createRsbuild({ rsbuildConfig });

        await rsbuild.startDevServer();
    };
