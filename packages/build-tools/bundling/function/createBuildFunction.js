import { createRsbuildConfig } from "./createRsbuildConfig.js";
import { printBuildStats } from "../printBuildStats.js";

export const createBuildFunction =
    () =>
    async ({ cwd }) => {
        process.env.NODE_ENV = "production";

        // Must be a dynamic import — see rslibCompile.js for the reason.
        const { createRsbuild } = await import("@rsbuild/core");
        const rsbuildConfig = await createRsbuildConfig({ cwd });

        const rsbuild = await createRsbuild({ rsbuildConfig });

        rsbuild.onAfterBuild(printBuildStats({ cwd, label: "node", extensions: [".mjs"] }));

        await rsbuild.build();
    };
