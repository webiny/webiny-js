import { createRsbuild } from "@rsbuild/core";
import { createRsbuildConfig } from "./createRsbuildConfig.js";
import { printBuildStats } from "../printBuildStats.js";

export const createBuildServer =
    () =>
    async ({ cwd }) => {
        process.env.NODE_ENV = "production";

        const rsbuildConfig = createRsbuildConfig({ cwd });

        const rsbuild = await createRsbuild({ rsbuildConfig });

        rsbuild.onAfterBuild(printBuildStats({ cwd, label: "server", extensions: [".mjs"] }));

        await rsbuild.build();
    };
