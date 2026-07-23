import path from "path";
import fs from "fs";
import { ApiAfterBuild, GetProjectService } from "@webiny/project/abstractions/index.js";
import { getServerBuildPaths } from "./getServerBuildPaths.js";

/**
 * Make the deployed build/ folder runnable on its own:
 *  - start.mjs: handler.mjs only EXPORTS the (async) handler, so a deploy needs an entry that imports
 *    it and listens. Copied verbatim from the start.mjs template next to this file.
 *  - package.json {"type":"module"} + start script: once build/ is copied out of the repo it has no
 *    parent package.json to inherit the module type from, so the raw-.js pollWorker asset would load
 *    as CJS and its `import` would throw. (In-repo, build/ sits under the app whose package.json is
 *    already type:module, so dev/watch resolves it by walking up — this is only for standalone build/.)
 */
class EmitDeployEntryImpl implements ApiAfterBuild.Interface {
    constructor(private getProjectService: GetProjectService.Interface) {}

    async execute() {
        const { buildDir } = getServerBuildPaths(this.getProjectService);

        if (!fs.existsSync(buildDir)) {
            return;
        }

        const startTemplate = path.join(import.meta.dirname, "start.mjs");
        fs.copyFileSync(startTemplate, path.join(buildDir, "start.mjs"));

        fs.writeFileSync(
            path.join(buildDir, "package.json"),
            JSON.stringify({ type: "module", scripts: { start: "node start.mjs" } }, null, 2) + "\n"
        );

        console.log("Emitted build/start.mjs + package.json (run with: node start.mjs).");
    }
}

export const EmitDeployEntry = ApiAfterBuild.createImplementation({
    implementation: EmitDeployEntryImpl,
    dependencies: [GetProjectService]
});
