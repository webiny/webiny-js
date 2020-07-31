const path = require("path");
const loadJson = require("load-json-file");
const writeJson = require("write-json-file");

const PROJECT_FOLDER = ".";

(async () => {
    require("./setupEnvFiles");

    const envJsonPath = path.resolve(PROJECT_FOLDER, ".env.json");
    const envJson = await loadJson.sync(envJsonPath);
    envJson.default.AWS_REGION = "eu-central-1";
    envJson.default.MONGODB_NAME = "webiny-" + new Date().getTime();
    envJson.default.MONGODB_SERVER = process.env.MONGODB_SERVER;
    await writeJson(envJsonPath, envJson);

    // Add "skipLibCheck" param to root tsconfig.build.file so the build happens faster.
    const tsConfigJsonPath = path.resolve(PROJECT_FOLDER, "tsconfig.build.json");
    const tsConfigJson = await loadJson.sync(tsConfigJsonPath);
    tsConfigJson.compilerOptions.skipLibCheck = true;
    await writeJson(tsConfigJsonPath, tsConfigJson);

    console.log(`✅️ Applied changes needed for running Webiny in CI.`);
})();
