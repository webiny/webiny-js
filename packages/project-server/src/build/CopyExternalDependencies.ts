import path from "path";
import fs from "fs";
import { nodeFileTrace } from "@vercel/nft";
import {
    ApiAfterBuild,
    GetProjectService,
    UiService
} from "@webiny/project/abstractions/index.js";
import { getServerBuildPaths } from "./getServerBuildPaths.js";

/**
 * Copy the external runtime deps into build/node_modules so the deployed build/ folder is
 * self-contained. The bundle keeps a few things external (sharp — native binary; knex + its driver
 * -> better-sqlite3), so they need to exist on disk. We trace the emitted files with @vercel/nft
 * rather than hand-listing packages: everything the app uses is bundled into handler.mjs, so whatever
 * is left as a bare import is exactly the external set, and nft reports the precise file closure
 * (native .node binaries included), pruning the rest. Deploys build in CI on the Linux target, so the
 * copied binaries match the deploy box by construction.
 */
const collectEmittedEntries = (dir: string): string[] => {
    const entries: string[] = [];
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            if (entry.name === "node_modules") {
                continue;
            }
            entries.push(...collectEmittedEntries(full));
        } else if (/\.(mjs|js)$/.test(entry.name)) {
            entries.push(full);
        }
    }
    return entries;
};

class CopyExternalDependenciesImpl implements ApiAfterBuild.Interface {
    constructor(
        private getProjectService: GetProjectService.Interface,
        private ui: UiService.Interface
    ) {}

    async execute() {
        const { projectRoot, buildDir } = getServerBuildPaths(this.getProjectService);

        if (!fs.existsSync(buildDir)) {
            return;
        }

        const entries = collectEmittedEntries(buildDir);
        if (!entries.length) {
            return;
        }

        const { fileList } = await nodeFileTrace(entries, { base: projectRoot });

        let copied = 0;
        for (const relPath of fileList) {
            // Only third-party runtime files; the app's own emitted files already live in build/.
            if (!relPath.startsWith("node_modules/")) {
                continue;
            }
            const src = path.join(projectRoot, relPath);
            const dest = path.join(buildDir, relPath);
            if (!fs.existsSync(src)) {
                continue;
            }
            // dereference: copy real files (monorepo deps may be symlinked) so the folder is portable.
            fs.mkdirSync(path.dirname(dest), { recursive: true });
            fs.cpSync(src, dest, { recursive: true, dereference: true, force: true });
            copied++;
        }

        this.ui.info("Copied %s external dependency file(s) into build/node_modules.", copied);
    }
}

export const CopyExternalDependencies = ApiAfterBuild.createImplementation({
    implementation: CopyExternalDependenciesImpl,
    dependencies: [GetProjectService, UiService]
});
