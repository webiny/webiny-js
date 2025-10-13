import "tsx";
import { defineConfig } from "vitest/config";
import fg from "fast-glob";
import path from "path";
import chalk from "chalk";
import * as dotenv from "dotenv";

const { blueBright } = chalk;

function sanitizeEsIndexName(name: string | undefined) {
    if (!name) {
        return undefined;
    }

    if ("GITHUB_RUN_ID" in process.env) {
        return `${process.env["GITHUB_RUN_ID"]}_${name}_`;
    }

    return name;
}

const findOneOf = (names: string[], dir: string) => {
    const matches = fg.sync([`**/{${names.join(",")}}`], {
        cwd: dir,
        absolute: true,
        onlyFiles: true
    });

    return matches[0];
};

const createPackageTestConfigPath = (pkg: string) => {
    const found = findOneOf(["vitest.config.ts", "vitest.config.js", "jest.config.js"], pkg);
    if (!found) {
        return null;
    }
    return found;
};

const createPackageJestSetupPath = (pkg: string) => {
    const found = findOneOf(["vitest.setup.ts", "vitest.setup.js", "jest.setup.js"], pkg);

    if (!found) {
        return null;
    }
    return found;
};

const importConfig = async (configPath: string) => {
    return import(configPath)
        .then(m => m.default ?? m)
        .then(config => {
            if (typeof config === "function") {
                return config();
            }
            return config;
        });
};

const getPackageTestSetup = async (pkg: string) => {
    const setupPath = createPackageJestSetupPath(pkg);
    if (!setupPath) {
        return null;
    }
    return await importConfig(setupPath);
};

export default async () => {
    // Sanitize ElasticsearchPrefix
    const esIndexPrefix = sanitizeEsIndexName(process.env.ELASTIC_SEARCH_INDEX_PREFIX);

    if (esIndexPrefix) {
        process.env.ELASTIC_SEARCH_INDEX_PREFIX = esIndexPrefix;
        process.stdout.write(`\nES index prefix: ${blueBright(esIndexPrefix)}\n\n`);
    }

    // Loads environment variables defined in the project root ".env" file.
    const { parsed } = dotenv.config({ path: path.join(import.meta.dirname, ".env") });
    if (parsed) {
        ["WCP_PROJECT_ID", "WCP_PROJECT_ENVIRONMENT", "WCP_PROJECT_LICENSE"].forEach(key => {
            delete parsed[key];
            delete process.env[key];
        });

        console.log('The following environment variables were included from the root ".env" file:');
        console.log(
            Object.keys(parsed).reduce((current, item) => {
                return current + `‣ ${item}\n`;
            }, "")
        );
    }

    const { getPackageMeta } = await import("./vitest.project.js");

    const packageMeta = await getPackageMeta();

    const configPath = createPackageTestConfigPath(packageMeta.packageRoot);
    const setup = await getPackageTestSetup(packageMeta.packageRoot);

    if (!configPath && !setup) {
        throw new Error(
            `${packageMeta.packageName} is missing a vitest.config.ts or a vitest.setup.ts file!`
        );
    }

    const project = configPath ? await importConfig(configPath) : setup;

    project.rootDir = process.cwd();

    return defineConfig({
        resolve: {
            alias: {
                "graphql/language/index.js": "graphql/language/index.js",
                "graphql/language/ast.js": "graphql/language/ast.js",
                graphql: "graphql/index.js"
            }
        },
        test: {
            fileParallelism: process.env.CI === "true",
            testTimeout: 30000, // 30 seconds
            ...project,
            setupFiles: [path.resolve(import.meta.dirname, "./setupFile.js"), ...project.setupFiles]
        }
    });
};
