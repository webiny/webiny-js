const setup = require("../setup");
const path = require("path");
const fs = require("fs-extra");
const writeJsonFile = require("write-json-file");
const loadJsonFile = require("load-json-file");
const getPackageJson = require("create-webiny-project/utils/getPackageJson");

const PROJECT_NAME = "test-123";
const PROJECT_ROOT = path.join(__dirname, PROJECT_NAME);

describe("VPC stack test", () => {
    beforeAll(async () => {
        fs.ensureDirSync(PROJECT_ROOT);

        const packageJson = getPackageJson(PROJECT_NAME);
        await writeJsonFile(path.join(PROJECT_ROOT, "package.json"), packageJson);

        await setup({
            projectName: PROJECT_NAME,
            projectRoot: PROJECT_ROOT,
            templateOptions: {
                vpc: true
            }
        });
    });

    afterAll(() => {
        fs.removeSync(PROJECT_ROOT);
    });

    test("should have the `vpc.ts` file", async () => {
        expect(fs.pathExistsSync(path.join(PROJECT_ROOT, "api/stack/vpc.ts"))).toBe(true);
    });

    test(`@webiny package versions in package.json files should be defined (not "latest")`, async () => {
        const packageJson = await loadJsonFile(path.join(PROJECT_ROOT, "package.json"));

        expect(packageJson.dependencies).toMatchObject({
            "@webiny/aws-layers": expect.stringMatching(/^\^5/),
            "@webiny/cli": expect.stringMatching(/^\^5/),
            "@webiny/cli-plugin-build": expect.stringMatching(/^\^5/),
            "@webiny/cli-plugin-deploy-pulumi": expect.stringMatching(/^\^5/),
            "@webiny/project-utils": expect.stringMatching(/^\^5/)
        });
    });
});
