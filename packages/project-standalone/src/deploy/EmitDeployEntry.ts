import path from "path";
import fs from "fs";
import {
    ApiAfterBuild,
    GetProjectConfigService,
    GetProjectService,
    UiService
} from "@webiny/project/abstractions/index.js";
import { getStandaloneBuildPaths } from "./getStandaloneBuildPaths.js";
import { getStandaloneDatabase } from "./getStandaloneDbDriver.js";

/**
 * Make the deployed build/ folder runnable on its own:
 *  - start.mjs: handler.mjs only EXPORTS the (async) handler, so a deploy needs an entry that imports
 *    it and listens. Copied verbatim from the start.mjs template next to this file.
 *  - package.json {"type":"module"} + start script: once build/ is copied out of the repo it has no
 *    parent package.json to inherit the module type from, so a raw-.js ESM asset would load as CJS
 *    and its `import` would throw. (In-repo, build/ sits under the app whose package.json is
 *    already type:module, so dev/watch resolves it by walking up — this is only for standalone build/.)
 */
class EmitDeployEntryImpl implements ApiAfterBuild.Interface {
    constructor(
        private getProjectService: GetProjectService.Interface,
        private ui: UiService.Interface,
        private getProjectConfigService: GetProjectConfigService.Interface
    ) {}

    async execute() {
        const { buildDir } = getStandaloneBuildPaths(this.getProjectService);

        if (!fs.existsSync(buildDir)) {
            return;
        }

        const startTemplate = path.join(import.meta.dirname, "start.mjs");
        fs.copyFileSync(startTemplate, path.join(buildDir, "start.mjs"));

        fs.writeFileSync(
            path.join(buildDir, "package.json"),
            JSON.stringify({ type: "module", scripts: { start: "node start.mjs" } }, null, 2) + "\n"
        );

        this.ui.info("Emitted build/start.mjs + package.json (run with: node start.mjs).");

        // PGlite is started by `watch` / `serve`, never by the deployed entry.
        const { pglite } = await getStandaloneDatabase(this.getProjectConfigService);
        if (pglite) {
            this.ui.warning(
                "This build connects to the PGlite database of <Infra.Pglite>, which only `webiny watch` and `webiny-standalone serve` start. For a deployment, configure <Infra.Postgres> with your Postgres server."
            );
        }
    }
}

export const EmitDeployEntry = ApiAfterBuild.createImplementation({
    implementation: EmitDeployEntryImpl,
    dependencies: [GetProjectService, UiService, GetProjectConfigService]
});
