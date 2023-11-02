/**
 * Dictates how package tests will be executed. With this script, we achieve
 * parallelization of execution of Jest tests. Note: do not use any 3rd party
 * libraries because we need this script to be executed in our CI/CD, as fast as possible.
 */

import fs from "fs";
import path from "path";

/**
 * Some packages require custom handling.
 */
const CUSTOM_HANDLERS: Record<string, () => Array<string>> = {
    // Ignore "i18n" package.
    i18n: () => [],

    // TODO: bring back project-utils tests.
    "project-utils": () => [],

    "api-tenancy": () => {
        return ["packages/api-tenancy --storage=ddb"];
    },

    "api-security": () => {
        return ["packages/api-security --storage=ddb"];
    },

    "api-security-cognito": () => {
        return ["packages/api-security-cognito --storage=ddb"];
    },

    "api-i18n": () => {
        return ["packages/api-i18n --storage=ddb"];
    },

    "api-tenant-manager": () => {
        return ["packages/api-tenant-manager --storage=ddb"];
    },

    "api-file-manager": () => {
        return [
            "packages/api-file-manager --storage=ddb",
            "packages/api-file-manager --storage=ddb-es,ddb"
        ];
    },

    "api-form-builder": () => {
        return [
            "packages/api-form-builder --storage=ddb",
            "packages/api-form-builder --storage=ddb-es,ddb"
        ];
    },

    "api-form-builder-so-ddb-es": () => {
        return ["packages/api-form-builder-so-ddb-es --storage=ddb-es,ddb"];
    },

    "api-page-builder": () => {
        return [
            "packages/api-page-builder --storage=ddb",
            "packages/api-page-builder --storage=ddb-es,ddb"
        ];
    },
    "api-page-builder-so-ddb-es": () => {
        return ["packages/api-page-builder-so-ddb-es --storage=ddb-es,ddb"];
    },

    "api-page-builder-import-export": () => {
        return ["packages/api-page-builder-import-export --storage=ddb"];
    },

    "api-prerendering-service": () => {
        return ["packages/api-prerendering-service --storage=ddb"];
    },

    "api-mailer": () => {
        return ["packages/api-mailer --storage=ddb", "packages/api-mailer --storage=ddb-es,ddb"];
    },

    "api-headless-cms": () => {
        return [
            "packages/api-headless-cms --storage=ddb",
            "packages/api-headless-cms --storage=ddb-es,ddb"
        ];
    },
    "api-headless-cms-ddb-es": () => {
        return ["packages/api-headless-cms-ddb-es --storage=ddb-es,ddb"];
    },
    "api-apw": () => {
        return [
            "packages/api-apw --storage=ddb"
            // TODO: With ddb-es setup, some tests are failing!
            // "packages/api-apw --storage=ddb-es,ddb"
        ];
    },
    "api-aco": () => {
        return ["packages/api-aco --storage=ddb", "packages/api-aco --storage=ddb-es,ddb"];
    },
    "api-page-builder-aco": () => {
        return [
            "packages/api-page-builder-aco --storage=ddb",
            "packages/api-page-builder-aco --storage=ddb-es,ddb"
        ];
    },
    "app-aco": () => {
        return ["packages/app-aco"];
    }
};

const testFilePattern = /test\.j?t?sx?$/;

const cmdToId = (cmd: string) => {
    return cmd
        .replace("packages/", "")
        .replace("--storage=", "")
        .replace(/[,\s]/g, "_")
        .replace(/[\(\)\[\]]/g, "")
        .toLowerCase();
};

/**
 * @param packageFolderPath
 * @returns boolean
 */
function hasTestFiles(packageFolderPath: string) {
    if (!fs.existsSync(packageFolderPath)) {
        return false;
    }

    const files = fs.readdirSync(packageFolderPath);
    for (let filename of files) {
        const filepath = path.join(packageFolderPath, filename);
        if (fs.statSync(filepath).isDirectory()) {
            const hasTFiles = hasTestFiles(filepath);
            if (hasTFiles) {
                return true;
            }
        } else if (testFilePattern.test(filepath)) {
            return true;
        }
    }
    return false;
}

interface ListPackagesWithJestTestsParams {
    storage?: string | null;
    ignorePackages?: string;
}

export const listPackagesWithJestTests = (params: ListPackagesWithJestTestsParams = {}) => {
    const allPackages = fs.readdirSync("packages");
    const packagesWithTests = [];

    for (let i = 0; i < allPackages.length; i++) {
        const packageName = allPackages[i];

        if (typeof CUSTOM_HANDLERS[packageName] === "function") {
            packagesWithTests.push(...CUSTOM_HANDLERS[packageName]());
        } else {
            const testsFolder = path.join("packages", packageName, "__tests__");
            if (hasTestFiles(testsFolder)) {
                packagesWithTests.push(`packages/${packageName}`);
            }
        }
    }

    const output = packagesWithTests.map(pkg => {
        return {
            cmd: pkg,
            id: cmdToId(pkg)
        };
    });

    const { storage } = params;
    if (storage === undefined) {
        return output;
    }

    if (storage === null) {
        return output.filter(item => !item.cmd.includes("--storage="));
    }

    return output.filter(item => item.cmd.includes(`--storage=${storage}`));
};
