import { createRsbuild } from "@rsbuild/core";
import { createRsbuildConfig } from "./createRsbuildConfig.js";
import { printBuildStats } from "../printBuildStats.js";

export const createBuildAdmin =
    () =>
    async ({ cwd }) => {
        process.env.NODE_ENV = "production";

        const rsbuildConfig = createRsbuildConfig({ cwd });

        const rsbuild = await createRsbuild({ rsbuildConfig });

        rsbuild.onAfterBuild(printBuildStats({ cwd, label: "admin", extensions: [".js", ".css"] }));

        await rsbuild.build();
    };
