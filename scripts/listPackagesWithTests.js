/**
 * Note: do not use any 3rd party libraries because we need this script
 * to be executed in our CI/CD, as fast as possible.
 */

const fs = require("fs");
const path = require("path");

const CUSTOM_HANDLERS = {
    // Skip "i18n" package.
    i18n: () => [],

    // Split "api-file-manager" tests into batches of
    "api-file-manager": () => {
        return [
            "packages/api-file-manager/* --keyword=fm:ddb --keyword=fm:base",
            "packages/api-file-manager/* --keyword=fm:ddb-es --keyword=fm:base"
        ];
    },

    // Split "api-form-builder" tests into batches of
    "api-form-builder": () => {
        return [
            "packages/api-form-builder/* --keyword=fb:ddb --keyword=fb:base",
            "packages/api-form-builder/* --keyword=fb:ddb-es --keyword=fb:base"
        ];
    },

    // Split "api-page-builder" tests into batches of
    "api-page-builder": () => {
        return [
            "packages/api-page-builder/* --keyword=pb:ddb --keyword=pb:base",
            "packages/api-page-builder/* --keyword=pb:ddb-es --keyword=pb:base"
        ];
    },
    // Split "api-headless-cms" tests into batches of
    "api-headless-cms": () => {
        return [
            "packages/api-headless-cms/* --keyword=cms:ddb --keyword=cms:base",
            "packages/api-headless-cms/* --keyword=cms:ddb-es --keyword=cms:base"
        ];
    },
    // Split "api-apw" tests into batches of
    "api-apw": () => {
        return [
            // TODO: APW tests currently only work with DynamoDB-only (it's hard-coded in the tests).
            //  That is because we currently have no way to load multiple storage operations at the same time.
            "packages/api-apw/*"
            // "packages/api-apw/* --keyword=cms:ddb --keyword=apw:base",
            // "packages/api-apw/* --keyword=cms:ddb-es --keyword=apw:base"
        ];
    }
};

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
        } else if (filepath.endsWith("test.js") || filepath.endsWith("test.ts")) {
            return true;
        }
    }
    return false;
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

console.log(JSON.stringify(packagesWithTests));
