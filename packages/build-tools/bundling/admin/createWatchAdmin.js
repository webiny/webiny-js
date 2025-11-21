import { createRsbuild } from "@rsbuild/core";
import { createRsbuildConfig } from "./createRsbuildConfig.js";

export const createWatchAdmin = config => async options => {
    process.env.NODE_ENV = "development";

    const rsbuildConfig = createRsbuildConfig();

    const rsbuild = await createRsbuild({ rsbuildConfig });

    await rsbuild.startDevServer();
};
