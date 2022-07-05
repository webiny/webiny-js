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

    // Split "api-file-manager" tests.
    "api-file-manager": () => {
        return [
            "packages/api-file-manager/* --keyword=fm:ddb --keyword=fm:base",
            "packages/api-file-manager/* --keyword=fm:ddb-es --keyword=fm:base"
        ];
    },

    // Split "api-form-builder" tests.
    "api-form-builder": () => {
        return [
            "packages/api-form-builder/* --keyword=fb:ddb --keyword=fb:base",
            "packages/api-form-builder/* --keyword=fb:ddb-es --keyword=fb:base"
        ];
    },

    // Split "api-page-builder" tests.
    "api-page-builder": () => {
        return [
            "packages/api-page-builder/* --keyword=pb:ddb --keyword=pb:base",
            "packages/api-page-builder/* --keyword=pb:ddb-es --keyword=pb:base"
        ];
    },
    // Split "api-headless-cms" tests.
    "api-headless-cms": () => {
        return [
            "packages/api-headless-cms/* --keyword=cms:ddb --keyword=cms:base",
            "packages/api-headless-cms/* --keyword=cms:ddb-es --keyword=cms:base"
        ];
    },
    // Split "api-apw" tests.
    "api-apw": () => {
        // TODO 1: we had to disable these temporarily because APW relies on WCP, and in our
        // TODO 1: CI/CD, we're not testing a WCP-enabled Webiny project yet (which causes errors).
        // TODO 1: Let's bring this ASAP or at least before releasing APW in Q3/2022.
        //return [];

        return [
            //     // TODO 2: APW tests currently only work with DynamoDB-only (it's hard-coded in the tests).
            //     // TODO 2: That is because we currently have no way to load multiple storage operations at the same time.
            "packages/api-apw/*"
            //     // "packages/api-apw/* --keyword=cms:ddb --keyword=apw:base",
            //     // "packages/api-apw/* --keyword=cms:ddb-es --keyword=apw:base"
        ];
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
        } else {
            return testFilePattern.test(filepath);
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

console.log(JSON.stringify(output));
