import path from "path";
import fs from "fs";
import { nodeFileTrace } from "@vercel/nft";
import { ApiAfterBuild, GetProjectService } from "@webiny/project/abstractions/index.js";

/**
 * After the api build (server hosting type), make build/ a self-contained, copy-deployable folder:
 *
 *  - Copy the external runtime deps into build/node_modules. The bundle keeps a few things external
 *    (sharp — native binary; knex + its driver -> better-sqlite3), so the folder needs them on disk.
 *    We trace the emitted files with @vercel/nft rather than hand-listing packages: everything the app
 *    uses is bundled into handler.mjs, so whatever's left as a bare import is exactly the external set,
 *    and nft reports the precise file closure (native .node binaries included), pruning the rest.
 *  - Emit start.mjs — handler.mjs only EXPORTS the (async) handler, so a deploy needs an entry that
 *    imports it and listens. Mirrors the dev apiServerRunner, build/-relative, no wait-for-build loop.
 *  - Emit package.json {"type":"module"} so the raw-.js pollWorker asset loads as ESM once build/ is
 *    copied out (in-repo it inherits the app package.json's module type by walking up; a standalone
 *    build/ has no parent).
 *
 * Registered only for the server hosting type (project-server), and this ApiAfterBuild hook runs on
 * `build` (not watch), so it's inherently server + build-time only. Deploys build in CI on the Linux
 * target, so the copied native binaries match the deploy box by construction.
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

class PackageServerBuildImpl implements ApiAfterBuild.Interface {
    constructor(private getProjectService: GetProjectService.Interface) {}

    async execute() {
        const project = this.getProjectService.execute();
        const projectRoot = project.paths.rootFolder.toString();
        const buildDir = project.paths.workspaceFolder
            .join("apps", "api", "graphql", "build")
            .toString();

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

        const startFile =
            [
                `import fs from "node:fs";`,
                `const wrapped = new URL("./_handler.mjs", import.meta.url);`,
                `const plain = new URL("./handler.mjs", import.meta.url);`,
                `const target = fs.existsSync(wrapped) ? wrapped : plain;`,
                `const { handler } = await import(target.href);`,
                `const server = await handler;`,
                `const port = Number(process.env.PORT || 3002);`,
                `server.listen(port, () => console.log("listening on http://localhost:" + port));`
            ].join("\n") + "\n";
        fs.writeFileSync(path.join(buildDir, "start.mjs"), startFile);

        fs.writeFileSync(
            path.join(buildDir, "package.json"),
            JSON.stringify({ type: "module", scripts: { start: "node start.mjs" } }, null, 2) + "\n"
        );

        console.log(`Packaged ${copied} node_modules file(s) + start.mjs into build/.`);
    }
}

export const PackageServerBuild = ApiAfterBuild.createImplementation({
    implementation: PackageServerBuildImpl,
    dependencies: [GetProjectService]
});
