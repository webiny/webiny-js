const path = require("path");
const loadJson = require("load-json-file");
const writeJson = require("write-json-file");
const { argv } = require("yargs");
const { MongoClient } = require("mongodb");
const uniqid = require("uniqid");

let db;
async function getDatabase(name) {
    if (db) {
        return db;
    }

    const client = await MongoClient.connect(process.env.MONGODB_SERVER, {
        useNewUrlParser: true,
        useUnifiedTopology: true
    });

    return client.db(name);
}

const PROJECT_FOLDER = ".";

(async () => {
    if (argv.postRun) {
        const envJsonPath = path.resolve(PROJECT_FOLDER, ".env.json");
        const envJson = await loadJson.sync(envJsonPath);

        const db = await getDatabase(envJson.default.MONGODB_NAME);
        await db.dropDatabase();
        console.log(`✅️ Dropped "${envJson.default.MONGODB_NAME}" MongoDB database.`);
        process.exit(0);
    }

    require("./setupEnvFiles");

    const envJsonPath = path.resolve(PROJECT_FOLDER, ".env.json");
    const envJson = await loadJson.sync(envJsonPath);

    envJson.default.AWS_REGION = "eu-central-1";
    envJson.default.MONGODB_NAME = "webiny-cy-e2e-test-" + uniqid();
    envJson.default.MONGODB_SERVER = process.env.MONGODB_SERVER;
    await writeJson(envJsonPath, envJson);

    // Add "skipLibCheck" param to root tsconfig.build.file so the build happens faster.
    const tsConfigJsonPath = path.resolve(PROJECT_FOLDER, "tsconfig.build.json");
    const tsConfigJson = await loadJson.sync(tsConfigJsonPath);
    tsConfigJson.compilerOptions.skipLibCheck = true;
    await writeJson(tsConfigJsonPath, tsConfigJson);

    console.log(`✅️ Applied changes needed for running Webiny in CI.`);
})();
