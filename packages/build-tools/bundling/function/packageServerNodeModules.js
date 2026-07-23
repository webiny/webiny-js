import path from "node:path";
import fs from "node:fs";
import fse from "fs-extra";
import fastGlob from "fast-glob";
import { nodeFileTrace } from "@vercel/nft";

/**
 * Populate build/node_modules with exactly the runtime dependencies the server bundle keeps external
 * (sharp, knex -> better-sqlite3, plus their transitive files including native .node binaries), so the
 * build/ folder is self-contained and deployable by copy.
 *
 * Server hosting type + production build only. Dev (webiny watch) doesn't need this — it resolves deps
 * from the monorepo's root node_modules. Deploys build in CI on the target platform (Linux), so the
 * installed binaries already match the Linux deploy box; the copied natives are correct by
 * construction (no cross-platform install needed).
 *
 * We trace the emitted files with @vercel/nft rather than hand-listing packages: everything the app
 * uses is bundled into handler.mjs, so whatever is left as a bare `import` is exactly the external set,
 * and nft follows those into node_modules and reports the precise file closure (natives included),
 * pruning the rest.
 */
export const packageServerNodeModules = async ({ cwd }) => {
    const buildDir = path.join(cwd, "build");
    const projectRoot = process.cwd();

    // Trace from every emitted JS file (handler + worker chunks + assets), so an external imported by
    // any of them is discovered.
    const entries = await fastGlob(["**/*.mjs", "**/*.js"], {
        cwd: buildDir,
        absolute: true,
        ignore: ["**/*.map", "**/node_modules/**"]
    });

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

        // dereference: copy the real files (monorepo deps may be symlinked) so the folder is portable.
        await fse.copy(src, dest, { dereference: true, overwrite: true });
        copied++;
    }

    console.log(`Packaged ${copied} node_modules file(s) into build/node_modules.`);

    // Emit a launcher so the copied build/ folder is runnable on its own: `node start.mjs`. handler.mjs
    // only EXPORTS the (async) handler — it doesn't listen — so a deploy needs an entry that imports it
    // and calls .listen(PORT). Mirrors the dev apiServerRunner (prefer the telemetry-wrapped _handler.mjs
    // when present, else the plain handler.mjs), but build/-relative and without the wait-for-build loop.
    const startFile = [
        `import fs from "node:fs";`,
        `const wrapped = new URL("./_handler.mjs", import.meta.url);`,
        `const plain = new URL("./handler.mjs", import.meta.url);`,
        `const target = fs.existsSync(wrapped) ? wrapped : plain;`,
        `const { handler } = await import(target.href);`,
        `const server = await handler;`,
        `const port = Number(process.env.PORT || 3002);`,
        `server.listen(port, () => console.log("listening on http://localhost:" + port));`,
        ``
    ].join("\n");
    fs.writeFileSync(path.join(buildDir, "start.mjs"), startFile);

    // Mark the standalone build/ as ESM (so the raw-.js pollWorker asset loads as a module) and give
    // it a start script. In dev this isn't needed — build/ sits under the app, whose package.json is
    // already "type": "module", so Node resolves the .js asset as ESM by walking up. But a copied-out
    // build/ has no parent to inherit from, so the deploy artifact must declare it itself.
    fs.writeFileSync(
        path.join(buildDir, "package.json"),
        JSON.stringify({ type: "module", scripts: { start: "node start.mjs" } }, null, 2) + "\n"
    );
    console.log("Emitted build/start.mjs + package.json (run with: node start.mjs).");
};
