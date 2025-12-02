import { createRsbuild } from "@rsbuild/core";
import { createRsbuildConfig } from "./createRsbuildConfig.js";

export const createBuildAdmin =
    () =>
    async ({ cwd }) => {
        process.env.NODE_ENV = "production";

        const rsbuildConfig = createRsbuildConfig({ cwd });

        const rsbuild = await createRsbuild({ rsbuildConfig });

        await rsbuild.build();
    };
