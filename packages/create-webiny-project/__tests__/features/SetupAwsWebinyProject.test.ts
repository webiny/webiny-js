import { describe, it, expect, beforeEach, afterEach } from "vitest";
import path from "path";
import fs from "fs-extra";
import os from "os";
import { SetupAwsWebinyProject } from "~/features/CreateWebinyProject/projects/aws/SetupAwsWebinyProject.js";
import type { CliParams } from "~/types.js";

// The Postgres handlers the project's api entry imports. Only `pg` projects install them.
const PG_HANDLER_PACKAGE = "@webiny/api-kernel-aws-pg";

// The CMS storage and the folder catalog come with `<Infra.AuroraPostgres />`, through `webiny`.
const PG_MODULE_PACKAGES = ["@webiny/api-aco-pg", "@webiny/api-headless-cms-pg"];

const createCliParams = (projectName: string, templateOptions: object): CliParams => ({
    projectName,
    force: false,
    template: "aws",
    templateOptions: JSON.stringify(templateOptions),
    assignToYarnrc: null,
    tag: "latest",
    interactive: false,
    log: "create-webiny-project-logs.txt",
    debug: false,
    cleanup: true,
    hostingType: "aws"
});

describe("SetupAwsWebinyProject", () => {
    let projectRoot: string;

    const readConfig = () => fs.readFileSync(path.join(projectRoot, "webiny.config.tsx"), "utf-8");
    const readDependencies = (): Record<string, string> =>
        fs.readJsonSync(path.join(projectRoot, "package.json")).dependencies;

    beforeEach(() => {
        projectRoot = fs.mkdtempSync(path.join(os.tmpdir(), "webiny-cwp-aws-"));
        // The base template's package.json, which every hosting-type setup adds to.
        fs.writeJsonSync(path.join(projectRoot, "package.json"), {
            name: "my-project",
            dependencies: { webiny: "latest" }
        });
    });

    afterEach(() => {
        fs.removeSync(projectRoot);
    });

    it("writes an Aurora Postgres config and installs the Postgres handlers for the `pg` option", async () => {
        const setup = new SetupAwsWebinyProject();
        const args = await setup.execute(
            createCliParams(projectRoot, { storageOps: "pg", region: "eu-central-1" })
        );

        expect(args.storageOps).toBe("pg");

        const config = readConfig();
        expect(config).toContain(`<Infra.Aws.DefaultRegion name={"eu-central-1"} />`);
        expect(config).toContain("<Infra.Vpc enabled={true} />");
        expect(config).toContain("<Infra.AuroraPostgres />");
        // The RDS Proxy is a commented option.
        expect(config).toContain("{/* <Infra.AuroraPostgres rdsProxy /> */}");
        // `<Infra.AuroraPostgres />` brings the CMS storage and the folder catalog itself.
        expect(config).not.toContain("HeadlessCmsPg");
        expect(config).not.toContain("AcoPg");
        expect(config).not.toContain("Infra.Postgres");
        expect(config).not.toContain("RdsProxy");
        expect(config).toContain("<Cognito />");
        expect(config).not.toContain("{REGION}");
        expect(config).not.toContain("OpenSearch");

        const dependencies = readDependencies();
        expect(dependencies[PG_HANDLER_PACKAGE]).toBe("latest");
        for (const name of PG_MODULE_PACKAGES) {
            expect(dependencies[name]).toBeUndefined();
        }
        // The AWS hosting packages are still there, and the base dependencies are kept.
        expect(dependencies["@webiny/project-aws"]).toBe("latest");
        expect(dependencies["@webiny/cognito"]).toBe("latest");
        expect(dependencies["webiny"]).toBe("latest");
        // Sorted, as the base template is.
        expect(Object.keys(dependencies)).toEqual([...Object.keys(dependencies)].sort());
    });

    it.each(["ddb", "ddb-os"])(
        "installs no Postgres packages for the `%s` option",
        async storageOps => {
            const setup = new SetupAwsWebinyProject();
            await setup.execute(createCliParams(projectRoot, { storageOps }));

            const config = readConfig();
            expect(config).not.toContain("Postgres");
            expect(config).not.toContain("HeadlessCmsPg");

            const dependencies = readDependencies();
            for (const name of [PG_HANDLER_PACKAGE, ...PG_MODULE_PACKAGES]) {
                expect(dependencies[name]).toBeUndefined();
            }
            expect(dependencies["@webiny/project-aws"]).toBe("latest");
        }
    );
});
