const setup = require("../setup");
const path = require("path");
const fs = require("fs-extra");
const writeJsonFile = require("write-json-file");
const dotenv = require("dotenv");

const PROJECT_NAME = "test-123";
const PROJECT_ROOT = path.join(__dirname, PROJECT_NAME);

const getPackageJson = projectName => ({
    name: projectName,
    version: "0.1.0",
    private: true
});

describe("root .env file generation test", () => {
    beforeAll(async () => {
        fs.ensureDirSync(PROJECT_ROOT);

        const packageJson = getPackageJson(PROJECT_NAME);
        await writeJsonFile(path.join(PROJECT_ROOT, "package.json"), packageJson);

        await setup({
            projectName: PROJECT_NAME,
            projectRoot: PROJECT_ROOT,
            templateOptions: {
                region: "eu-central-1"
            }
        });
    });

    afterAll(() => {
        fs.removeSync(PROJECT_ROOT);
    });

    test("root .env file should exist", async () => {
        expect(fs.pathExistsSync(path.join(PROJECT_ROOT, ".env"))).toBe(true);
    });

    test("should update root .env file correctly", async () => {
        const config = dotenv.parse(fs.readFileSync(path.join(PROJECT_ROOT, ".env")));
        expect(config).toMatchObject({
            AWS_REGION: "eu-central-1",
            PULUMI_SECRETS_PROVIDER: "passphrase"
        });

        expect(config.PULUMI_CONFIG_PASSPHRASE.length).toBe(32);
    });
});
