/**
 * Note: do not use any 3rd party libraries because we need this script
 * to be executed in our CI/CD, as fast as possible.
 */

const fs = require("fs");

const CUSTOM_HANDLERS = {};

// Currently, we are only examining tests in the "cypress/integration/admin" folder.
const allTests = fs.readdirSync("cypress/integration/admin");

const packagesWithTests = [];
for (let i = 0; i < allTests.length; i++) {
    const folderName = allTests[i];

    if (typeof CUSTOM_HANDLERS[folderName] === "function") {
        packagesWithTests.push(...CUSTOM_HANDLERS[folderName]());
    } else {
        packagesWithTests.push(`cypress/integration/admin/${folderName}/**/*.spec.js/`);
    }
}

console.log(JSON.stringify(packagesWithTests));
