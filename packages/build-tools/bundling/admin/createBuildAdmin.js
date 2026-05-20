import { createRsbuildConfig } from "./createRsbuildConfig.js";
import { printBuildStats } from "../printBuildStats.js";

export const createBuildAdmin =
    () =>
    async ({ cwd }) => {
        process.env.NODE_ENV = "production";

        // Must be a dynamic import — see rslibCompile.js for the reason.
        const { createRsbuild } = await import("@rsbuild/core");
        const rsbuildConfig = createRsbuildConfig({ cwd });

        const rsbuild = await createRsbuild({ rsbuildConfig });

        rsbuild.onAfterBuild(printBuildStats({ cwd, label: "admin", extensions: [".js", ".css"] }));

        await rsbuild.build();
    };
