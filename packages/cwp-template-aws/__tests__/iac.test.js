const setup = require("../setup");
const path = require("path");
const fs = require("fs-extra");
const writeJsonFile = require("write-json-file");
const getPackageJson = require("create-webiny-project/utils/getPackageJson");
const yaml = require("js-yaml");

const PROJECT_NAME = "test-123";
const PROJECT_ROOT = path.join(__dirname, PROJECT_NAME);

const PULUMI_YAML_FOLDERS = ["api", "apps/admin", "apps/website"];

describe("`iac` template option test", () => {
    afterAll(() => {
        fs.removeSync(PROJECT_ROOT);
    });

    test("should have backend URL set in Pulumi.yaml files", async () => {
        fs.ensureDirSync(PROJECT_ROOT);

        const packageJson = getPackageJson(PROJECT_NAME);
        await writeJsonFile(path.join(PROJECT_ROOT, "package.json"), packageJson);

        const url = "s3://test-s3-bucket/test-folder/";

        await setup({
            projectName: PROJECT_NAME,
            projectRoot: PROJECT_ROOT,
            templateOptions: {
                iac: ["pulumi", { backend: { url } }]
            }
        });

        for (let i = 0; i < PULUMI_YAML_FOLDERS.length; i++) {
            const pulumiYamlFolder = PULUMI_YAML_FOLDERS[i];
            const pulumiYamlPath = path.join(PROJECT_ROOT, pulumiYamlFolder, "Pulumi.yaml");
            const content = fs.readFileSync(pulumiYamlPath, "utf-8");
            const config = yaml.load(content);
            expect(config.backend.url).toBe(url + pulumiYamlFolder);
        }
    });

    test("should use `file://` as the default backend URL", async () => {
        fs.ensureDirSync(PROJECT_ROOT);

        const packageJson = getPackageJson(PROJECT_NAME);
        await writeJsonFile(path.join(PROJECT_ROOT, "package.json"), packageJson);

        await setup({
            projectName: PROJECT_NAME,
            projectRoot: PROJECT_ROOT
        });

        for (let i = 0; i < PULUMI_YAML_FOLDERS.length; i++) {
            const pulumiYamlFolder = PULUMI_YAML_FOLDERS[i];
            const pulumiYamlPath = path.join(PROJECT_ROOT, pulumiYamlFolder, "Pulumi.yaml");
            const content = fs.readFileSync(pulumiYamlPath, "utf-8");
            const config = yaml.load(content);
            expect(config.backend.url).toBe("file://");
        }
    });
});
