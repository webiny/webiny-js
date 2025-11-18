import { createRsbuild } from "@rsbuild/core";
import { createRsbuildConfig } from "./createRsbuildConfig.js";

export const createBuildAdmin = config => async options => {
    process.env.NODE_ENV = "production";

    const rsbuildConfig = createRsbuildConfig();

    const rsbuild = await createRsbuild({ rsbuildConfig });

    await rsbuild.build();
};
