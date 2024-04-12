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

interface PackageWithTests {
    cmd: string;
    storage?: string | string[];
}

interface PackageWithTestsWithId extends PackageWithTests {
    id: string;
}

const CUSTOM_HANDLERS: Record<string, () => Array<PackageWithTests>> = {
    // Ignore "i18n" package.
    i18n: () => [],

    // TODO: bring back project-utils tests.
    "project-utils": () => [],

    "api-tenancy": () => {
        return [{ cmd: "packages/api-tenancy --storage=ddb", storage: "ddb" }];
    },

    "api-security": () => {
        return [{ cmd: "packages/api-security --storage=ddb", storage: "ddb" }];
    },

    "api-security-cognito": () => {
        return [{ cmd: "packages/api-security-cognito --storage=ddb", storage: "ddb" }];
    },

    "api-i18n": () => {
        return [{ cmd: "packages/api-i18n --storage=ddb", storage: "ddb" }];
    },

    "api-tenant-manager": () => {
        return [{ cmd: "packages/api-tenant-manager --storage=ddb", storage: "ddb" }];
    },

    "api-file-manager": () => {
        return [
            { cmd: "packages/api-file-manager --storage=ddb", storage: "ddb" },
            {
                cmd: "packages/api-file-manager --storage=ddb-es,ddb",
                storage: "ddb-es"
            },
            {
                cmd: "packages/api-file-manager --storage=ddb-os,ddb",
                storage: "ddb-os"
            }
        ];
    },

    "api-form-builder": () => {
        return [
            { cmd: "packages/api-form-builder --storage=ddb-es,ddb", storage: "ddb-es" },
            { cmd: "packages/api-form-builder --storage=ddb-os,ddb", storage: "ddb-os" },
            { cmd: "packages/api-form-builder --storage=ddb", storage: "ddb" }
        ];
    },

    "api-form-builder-so-ddb-es": () => {
        return [
            {
                cmd: "packages/api-form-builder-so-ddb-es --storage=ddb-es,ddb",
                storage: "ddb-es"
            },
            {
                cmd: "packages/api-form-builder-so-ddb-es --storage=ddb-os,ddb",
                storage: "ddb-os"
            }
        ];
    },

    "api-page-builder": () => {
        return [
            { cmd: "packages/api-page-builder --storage=ddb-es,ddb", storage: "ddb-es" },
            { cmd: "packages/api-page-builder --storage=ddb-os,ddb", storage: "ddb-os" },
            { cmd: "packages/api-page-builder --storage=ddb", storage: "ddb" }
        ];
    },
    "api-page-builder-so-ddb-es": () => {
        return [
            {
                cmd: "packages/api-page-builder-so-ddb-es --storage=ddb-es,ddb",
                storage: "ddb-es"
            },
            {
                cmd: "packages/api-page-builder-so-ddb-es --storage=ddb-os,ddb",
                storage: "ddb-os"
            }
        ];
    },

    "api-page-builder-import-export": () => {
        return [
            {
                cmd: "packages/api-page-builder-import-export --storage=ddb",
                storage: "ddb"
            }
        ];
    },

    "api-prerendering-service": () => {
        return [{ cmd: "packages/api-prerendering-service --storage=ddb", storage: "ddb" }];
    },

    "api-mailer": () => {
        return [
            { cmd: "packages/api-mailer --storage=ddb", storage: "ddb" },
            { cmd: "packages/api-mailer --storage=ddb-es,ddb", storage: "ddb-es" },
            { cmd: "packages/api-mailer --storage=ddb-os,ddb", storage: "ddb-os" }
        ];
    },

    "api-headless-cms": () => {
        return [
            { cmd: "packages/api-headless-cms --storage=ddb", storage: "ddb" },
            { cmd: "packages/api-headless-cms --storage=ddb-es,ddb", storage: "ddb-es" },
            { cmd: "packages/api-headless-cms --storage=ddb-os,ddb", storage: "ddb-os" }
        ];
    },
    "api-headless-cms-ddb-es": () => {
        return [
            {
                cmd: "packages/api-headless-cms-ddb-es --storage=ddb-es,ddb",
                storage: "ddb-es"
            },
            {
                cmd: "packages/api-headless-cms-ddb-es --storage=ddb-os,ddb",
                storage: "ddb-os"
            }
        ];
    },
    "api-headless-cms-aco": () => {
        return [
            { cmd: "packages/api-headless-cms-aco --storage=ddb", storage: "ddb" },
            { cmd: "packages/api-headless-cms-aco --storage=ddb-es,ddb", storage: "ddb-es" },
            { cmd: "packages/api-headless-cms-aco --storage=ddb-os,ddb", storage: "ddb-os" }
        ];
    },
    "api-apw": () => {
        return [
            { cmd: "packages/api-apw --storage=ddb", storage: "ddb" }
            // TODO: With ddb-es setup, some tests are failing!
            // "packages/api-apw --storage=ddb-es,ddb"
        ];
    },
    "api-aco": () => {
        return [
            { cmd: "packages/api-aco --storage=ddb", storage: "ddb" },
            { cmd: "packages/api-aco --storage=ddb-es,ddb", storage: "ddb-es" },
            { cmd: "packages/api-aco --storage=ddb-os,ddb", storage: "ddb-os" }
        ];
    },
    "api-audit-logs": () => {
        return [
            { cmd: "packages/api-audit-logs --storage=ddb", storage: "ddb" },
            { cmd: "packages/api-audit-logs --storage=ddb-es,ddb", storage: "ddb-es" },
            { cmd: "packages/api-audit-logs --storage=ddb-os,ddb", storage: "ddb-os" }
        ];
    },
    "api-page-builder-aco": () => {
        return [
            { cmd: "packages/api-page-builder-aco --storage=ddb", storage: "ddb" },
            {
                cmd: "packages/api-page-builder-aco --storage=ddb-es,ddb",
                storage: "ddb-es"
            },
            {
                cmd: "packages/api-page-builder-aco --storage=ddb-os,ddb",
                storage: "ddb-os"
            }
        ];
    },
    "app-aco": () => {
        return [
            {
                cmd: "packages/app-aco"
            }
        ];
    },
    migrations: () => {
        return [
            {
                cmd: "packages/migrations",
                // This will run migrations against DynamoDB too twice, once with each storage
                // driver. This is because, at the moment, we can't run migrations against DynamoDB only.
                // That's why we're not including "ddb" in the list below.
                storage: ["ddb-es", "ddb-os"]
            }
        ];
    },
    "api-elasticsearch": () => {
        return [
            {
                cmd: "packages/api-elasticsearch",
                storage: ["ddb-es", "ddb-os"]
            }
        ];
    },
    tasks: () => {
        return [
            { cmd: "packages/tasks --storage=ddb", storage: "ddb" },
            {
                cmd: "packages/tasks --storage=ddb-es,ddb",
                storage: "ddb-es"
            },
            {
                cmd: "packages/tasks --storage=ddb-os,ddb",
                storage: "ddb-os"
            }
        ];
    },
    "api-elasticsearch-tasks": () => {
        return [
            {
                cmd: "packages/api-elasticsearch-tasks --storage=ddb-es,ddb",
                storage: "ddb-es"
            },
            {
                cmd: "packages/api-elasticsearch-tasks --storage=ddb-os,ddb",
                storage: "ddb-os"
            }
        ];
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
    for (const filename of files) {
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
                packagesWithTests.push({ cmd: `packages/${packageName}` } as PackageWithTests);
            }
        }
    }

    const output = packagesWithTests.map(pkg => {
        return {
            ...pkg,
            id: cmdToId(pkg.cmd)
        } as PackageWithTestsWithId;
    });

    const { storage } = params;
    if (storage === undefined) {
        return output;
    }

    if (storage === null) {
        return output.filter(item => !item.storage || !item.storage.length);
    }

    return output.filter(item => {
        if (Array.isArray(item.storage)) {
            return item.storage.includes(storage);
        }
        return item.storage === storage;
    });
};
