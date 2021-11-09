const { parentPort } = require("worker_threads");
const fs = require("fs-extra");
const path = require("path");
const writeJson = require("write-json-file");
const { hashElement } = require("folder-hash");

require("@webiny/cli/utils/importModule");

parentPort.on("message", async data => {
    try {
        const { metaJson, currentPackage, buildOverrides, CACHE_FOLDER_PATH, META_FILE_PATH } =
            JSON.parse(data);

        const configPath = path
            .join(currentPackage.packageFolder, "webiny.config")
            .replace(/\\/g, "/");
        const config = require(configPath);

        await config.commands.build({
            logs: false,
            debug: false,
            overrides: buildOverrides
            // We don't want debug nor regular logs logged within the build command.
        });

        // Copy and paste built code into the cache folder.
        const cacheFolderPath = path.join(CACHE_FOLDER_PATH, currentPackage.packageJson.name);
        fs.copySync(path.join(currentPackage.packageFolder, "dist"), cacheFolderPath);

        const sourceHash = await getPackageSourceHash(currentPackage);
        metaJson.packages[currentPackage.packageJson.name] = { sourceHash };

        writeJson.sync(META_FILE_PATH, metaJson);

        parentPort.postMessage(JSON.stringify({ error: null }));
        process.exit(0);
    } catch (e) {
        parentPort.postMessage(JSON.stringify({ error: { message: e.message } }));
        process.exit(1);
    }
});

async function getPackageSourceHash(workspacePackage) {
    const { hash } = await hashElement(workspacePackage.packageFolder, {
        folders: { exclude: ["dist"] },
        files: { exclude: ["tsconfig.build.tsbuildinfo"] }
    });

    return hash;
}
