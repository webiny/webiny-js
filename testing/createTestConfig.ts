import { basename, join } from "path";
import fs from "fs";
import type { ViteUserConfig } from "vitest/config";
import { testPattern } from "./vitest.project.js";

type Alias = Extract<NonNullable<ViteUserConfig["test"]>["alias"], { find: any }>;

type TestPreset = {
    setupFiles?: string[];
    setupFilesAfterEnv?: string[];
};

type CreateTestConfigParams = {
    path: string;
    presets?: TestPreset[];
    vitestConfig?: ViteUserConfig["test"];
};

export const createTestConfig = async ({
    path,
    presets = [],
    vitestConfig: initialVitestConfig = {}
}: CreateTestConfigParams): Promise<NonNullable<ViteUserConfig["test"]>> => {
    const name = basename(path);
    /**
     * We want to collect coverage only from the package that is currently being tested.
     * If we do not do this, it will collect coverage from all packages, which is not what we want.
     *
     * User can override this by providing their own `vitestConfig` with `coverage` property.
     */
    const vitestConfig = {
        coverage: {
            include: [`packages/${name}/src/**/*`]
        },
        ...initialVitestConfig
    };

    const { PackageJson } = await import("@webiny/build-tools/utils/PackageJson.js");
    const cliPackage = await PackageJson.fromPackage("@webiny/cli");
    const version = cliPackage.getJson().version;

    process.env.DB_TABLE = "DynamoDB";
    process.env.DB_TABLE_ELASTICSEARCH = "ElasticsearchStream";
    process.env.DB_TABLE_LOG = "DynamoDBLog";
    process.env.DB_TABLE_AUDIT_LOGS = "DynamoDBAuditLogs";
    process.env.WEBINY_VERSION = version;
    process.env.WEBINY_ELASTICSEARCH_INDEX_LOCALE = "true";

    // Enables us to run tests of only a specific type (for example "integration" or "e2e").
    let type = "";
    if (process.env.TEST_TYPE) {
        type = `.${process.env.TEST_TYPE}`;
    }

    process.env.JEST_DYNALITE_CONFIG_DIRECTORY = path;

    const project: ViteUserConfig["test"] = {
        name: name,
        include: [`${path}${testPattern}`],
        dir: path,
        fileParallelism: false,
        ...vitestConfig,
        css: false,
        alias: [
            {
                find: /^~tests(.*)/,
                replacement: `${path}/__tests__$1`
            },
            { find: /^~(.*)/, replacement: `${path}/src$1` },
            ...((vitestConfig.alias ?? []) as Alias)
        ]
    };

    const setupAfterEnv = join(path, "__tests__", "setup", "setupAfterEnv.js");
    const setupAfterEnvExists = fs.existsSync(setupAfterEnv);

    project.setupFiles = [
        ...presets.map(preset => preset.setupFiles || []),
        ...presets.map(preset => preset.setupFilesAfterEnv || []),
        setupAfterEnvExists ? setupAfterEnv : undefined
    ]
        .flat()
        .filter(Boolean) as string[];

    process.stdout.write(`\n---------------------------\n`);

    return project;
};
