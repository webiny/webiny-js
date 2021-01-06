const path = require("path");
const loadJson = require("load-json-file");
const writeJson = require("write-json-file");

const PROJECT_FOLDER = ".";

(async () => {
    require("./setupEnvFiles");

    // Add "skipLibCheck" param to root tsconfig.build.file so the build command executes faster.
    const tsConfigJsonPath = path.resolve(PROJECT_FOLDER, "tsconfig.build.json");
    const tsConfigJson = await loadJson.sync(tsConfigJsonPath);
    tsConfigJson.compilerOptions.skipLibCheck = true;
    await writeJson(tsConfigJsonPath, tsConfigJson);
    console.log(`✅️ Applied changes needed for running Webiny in CI.`);
})();
