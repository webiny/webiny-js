import { createRsbuildConfig } from "./createRsbuildConfig.js";

export const createWatchAdmin =
    () =>
    async ({ cwd }) => {
        process.env.NODE_ENV = "development";

        // Must be a dynamic import — see rslibCompile.js for the reason.
        const { createRsbuild } = await import("@rsbuild/core");
        const rsbuildConfig = createRsbuildConfig({ cwd });

        const rsbuild = await createRsbuild({ rsbuildConfig });

        await rsbuild.startDevServer();
    };
