import { createRsbuild } from "@rsbuild/core";
import { createRsbuildConfig } from "./createRsbuildConfig.js";

export const createWatchFunction =
    () =>
    async ({ cwd }) => {
        process.env.NODE_ENV = "development";

        const rsbuildConfig = createRsbuildConfig({ cwd });

        const rsbuild = await createRsbuild({ rsbuildConfig });

        await rsbuild.build({ watch: true });
    };
