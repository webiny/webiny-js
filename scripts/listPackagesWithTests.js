#!/usr/bin/env node
const fs = require("fs");
const path = require("path");

/**
 * Because of CI/CD and the need to skip install of any extra dependencies,
 * we decided to stay away from using a glob library.
 * @param folder
 * @returns {*[]}
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
    const current = allPackages[i];
    const testsFolder = path.join("packages", current, "__tests__");
    if (hasTestFiles(testsFolder)) {
        packagesWithTests.push(current);
    }
}

console.log(JSON.stringify(packagesWithTests));
