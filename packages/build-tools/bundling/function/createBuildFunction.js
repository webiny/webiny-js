import { createRsbuildConfig } from "./createRsbuildConfig.js";
import { printBuildStats } from "../printBuildStats.js";
import { packageServerNodeModules } from "./packageServerNodeModules.js";

export const createBuildFunction =
    () =>
    async ({ cwd }) => {
        process.env.NODE_ENV = "production";

        // Must be a dynamic import — see rslibCompile.js for the reason.
        const { createRsbuild } = await import("@rsbuild/core");
        const rsbuildConfig = await createRsbuildConfig({ cwd, enforceMaxBundleSize: true });

        const rsbuild = await createRsbuild({ rsbuildConfig });

        rsbuild.onAfterBuild(printBuildStats({ cwd, label: "node", extensions: [".mjs"] }));

        await rsbuild.build();

        // Server hosting type: the bundle keeps a few deps external (sharp, knex + its driver), which
        // can't be bundled. Copy them into build/node_modules so the build/ folder is self-contained
        // and deployable by copy. Build-time only (watch resolves from the root node_modules); on CI
        // (Linux) the copied native binaries match the Linux deploy target.
        if (process.env.WEBINY_HOSTING_TYPE === "server") {
            await packageServerNodeModules({ cwd });
        }
    };
