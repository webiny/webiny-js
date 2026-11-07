import fs from "fs";
import path from "path";
import { createRsbuildConfig } from "./createRsbuildConfig.js";
import { printBuildStats } from "../printBuildStats.js";

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

        // Set by `<Infra.Api.WebFunction enabled />`. Only function workspaces that ship a `web.ts`
        // entry (the API's graphql workspace) have a web bundle to build.
        const buildWeb =
            process.env.WEBINY_API_WEB_FUNCTION === "true" &&
            fs.existsSync(path.join(cwd, "src", "web.ts"));

        if (!buildWeb) {
            return;
        }

        // No size limit: this bundle includes the AWS SDK, which the regular one leaves to the runtime.
        const webRsbuildConfig = await createRsbuildConfig({
            cwd,
            enforceMaxBundleSize: false,
            web: true
        });

        const webRsbuild = await createRsbuild({ rsbuildConfig: webRsbuildConfig });

        webRsbuild.onAfterBuild(printBuildStats({ cwd, label: "web", extensions: [".mjs"] }));

        await webRsbuild.build();
    };
