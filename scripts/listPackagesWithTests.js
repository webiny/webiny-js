#!/usr/bin/env node
const fs = require("fs");
const path = require("path");

const SKIP_PACKAGES = ["i18n"];

/**
 * Because of CI/CD and the need to skip the installation of any extra
 * dependencies, we decided to stay away from using a glob-like library.
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
    if (SKIP_PACKAGES.includes(packageName)) {
        continue;
    }

    const testsFolder = path.join("packages", packageName, "__tests__");
    if (hasTestFiles(testsFolder)) {
        packagesWithTests.push(packageName);
    }
}

console.log(JSON.stringify(packagesWithTests));
