import { createRsbuildConfig } from "./createRsbuildConfig.js";
import { printBuildStats } from "../printBuildStats.js";

/**
 * `options.web`: also build `src/web.ts` into `build-web/index.mjs`, the entry of a Lambda web
 * function. The workspace decides, in its own `webiny.config.ts`.
 */
export const createBuildFunction =
    (options = {}) =>
    async ({ cwd }) => {
        process.env.NODE_ENV = "production";

        // Must be a dynamic import — see rslibCompile.js for the reason.
        const { createRsbuild } = await import("@rsbuild/core");
        const rsbuildConfig = await createRsbuildConfig({ cwd, enforceMaxBundleSize: true });

        const rsbuild = await createRsbuild({ rsbuildConfig });

        rsbuild.onAfterBuild(printBuildStats({ cwd, label: "node", extensions: [".mjs"] }));

        await rsbuild.build();

        if (!options.web) {
            return;
        }

        // No size limit: this bundle includes the AWS SDK, which the regular one leaves to the runtime.
        const webRsbuildConfig = await createRsbuildConfig({
            cwd,
            enforceMaxBundleSize: false,
            web: true
        });

        const webRsbuild = await createRsbuild({ rsbuildConfig: webRsbuildConfig });

        const printWebBuildStats = printBuildStats({ cwd, label: "web", extensions: [".mjs"] });
        webRsbuild.onAfterBuild(printWebBuildStats);

        await webRsbuild.build();
    };
