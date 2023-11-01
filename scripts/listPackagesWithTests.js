/**
 * Dictates how package tests will be executed. With this script, we achieve
 * parallelization of execution of Jest tests. Note: do not use any 3rd party
 * libraries because we need this script to be executed in our CI/CD, as fast as possible.
 */

const fs = require("fs");
const path = require("path");

/**
 * Some packages require custom handling.
 */
const CUSTOM_HANDLERS = {
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

    "api-audit-logs": () => {
        return [
            "packages/api-audit-logs --storage=ddb",
            "packages/api-audit-logs --storage=ddb-es,ddb"
        ];
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

/**
 * @param folder
 * @returns boolean
 */
function hasTestFiles(folder) {
    if (!fs.existsSync(folder)) {
        return false;
    }

    const files = fs.readdirSync(folder);
    for (let filename of files) {
        const filepath = path.join(folder, filename);
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

const args = {};
for (let i = 0; i < process.argv.length; i++) {
    const current = process.argv[i];
    if (current.startsWith("--")) {
        const [name, value = true] = current.split("=");
        args[name] = value;
    }
}

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

let output = [...packagesWithTests];

const ignorePackagesPattern = args["--ignore-packages"];
if (ignorePackagesPattern) {
    output = output.filter(current => !current.includes(ignorePackagesPattern));
}

const cmdToId = cmd => {
    return cmd
        .replace("packages/", "")
        .replace("--storage=", "")
        .replace(/[,\s]/g, "_")
        .replace(/[\(\)\[\]]/g, "")
        .toLowerCase();
};

const tasks = output.map(pkg => {
    return {
        cmd: pkg,
        id: cmdToId(pkg)
    };
});

console.log(JSON.stringify(tasks));
