import { createRsbuild } from "@rsbuild/core";
import { createRsbuildConfig } from "./createRsbuildConfig.js";

export const createWatchAdmin =
    () =>
    async ({ cwd }) => {
        process.env.NODE_ENV = "development";

        const rsbuildConfig = createRsbuildConfig({ cwd });

        const rsbuild = await createRsbuild({ rsbuildConfig });

        await rsbuild.startDevServer();
    };
