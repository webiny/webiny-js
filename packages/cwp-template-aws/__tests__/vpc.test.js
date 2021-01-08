const setup = require("../setup");
const path = require("path");
const fs = require("fs-extra");
const writeJsonFile = require("write-json-file");
const getPackageJson = require("create-webiny-project/utils/getPackageJson");

const PROJECT_NAME = "test-123";
const PROJECT_ROOT = path.join(__dirname, PROJECT_NAME);

describe("VPC stack test", () => {
    beforeAll(async () => {
        fs.ensureDirSync(PROJECT_ROOT);

        const packageJson = getPackageJson(PROJECT_NAME);
        await writeJsonFile(path.join(PROJECT_ROOT, "package.json"), packageJson);
    });

    afterAll(() => {
        fs.removeSync(PROJECT_ROOT);
    });

    test("should scaffold files correctly and stack files should include VPC setup", async () => {
        await setup({
            projectName: PROJECT_NAME,
            projectRoot: PROJECT_ROOT,
            vpc: true
        });

        expect(fs.pathExistsSync(path.join(PROJECT_ROOT, "api/stack/vpc.ts"))).toBe(true);
    });
});
