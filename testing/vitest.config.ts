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

export default defineConfig(async () => {
    // Sanitize Opensearch
    const osIndexPrefix = sanitizeEsIndexName(process.env.OPENSEARCH_INDEX_PREFIX);

    if (osIndexPrefix) {
        process.env.OPENSEARCH_INDEX_PREFIX = osIndexPrefix;
        process.stdout.write(`\nOS index prefix: ${blueBright(osIndexPrefix)}\n\n`);
    }

    // Loads environment variables defined in the project root ".env" file.
    const { parsed } = dotenv.config({
        path: path.join(import.meta.dirname, "..", ".env"),
        quiet: true
    });

    if (parsed) {
        [
            "WEBINY_PROJECT_ID",
            "WEBINY_PROJECT_API_KEY",
            "WCP_PROJECT_ID",
            "WCP_PROJECT_ENVIRONMENT",
            "WCP_PROJECT_LICENSE"
        ].forEach(key => {
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

    return {
        resolve: {
            alias: [
                /**
                 * `@webiny/icons` ships raw `.svg` files that a real build turns into React
                 * components through a bundler plugin. Vitest has no such plugin, so the import
                 * resolves to something without a `ReactComponent` export and React throws while
                 * rendering it — which makes every design-system component that uses an icon
                 * unrenderable in tests, the accordion and the tag among them.
                 *
                 * Scoped to `@webiny/icons` so a project-local svg imported for its URL is
                 * untouched.
                 */
                {
                    find: /^@webiny\/icons\/.*\.svg$/,
                    replacement: path.resolve(import.meta.dirname, "./svgStub.tsx")
                },
                { find: "graphql/language/index.js", replacement: "graphql/language/index.js" },
                { find: "graphql/language/ast.js", replacement: "graphql/language/ast.js" },
                { find: /^graphql$/, replacement: "graphql/index.js" }
            ],
            tsconfigPaths: true
        },
        test: {
            fileParallelism: process.env.CI === "true",
            hookTimeout: 30000,
            testTimeout: 30000, // 30 seconds
            ...project,
            setupFiles: [
                path.resolve(import.meta.dirname, "./setupFile.js"),
                ...(project.setupFiles || [])
            ],
            tsconfig: `${project.dir}/tsconfig.json`
        }
    };
});
