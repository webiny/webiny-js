/**
 * Note: do not use any 3rd party libraries because we need this script
 * to be executed in our CI/CD, as fast as possible.
 */
const fs = require("fs");

const CUSTOM_HANDLERS = {};

// Currently, we are only examining tests in the "cypress-tests/cypress/e2e/admin" folder.
const allTests = fs.readdirSync("cypress-tests/cypress/e2e/admin");

const packagesWithTests = [];
for (let i = 0; i < allTests.length; i++) {
    const folderName = allTests[i];

    if (typeof CUSTOM_HANDLERS[folderName] === "function") {
        packagesWithTests.push(...CUSTOM_HANDLERS[folderName]());
    } else {
        // In the CI, these paths will be used in a process where `cypress-tests`
        // is already set as the current working directory.
        packagesWithTests.push(`cypress/e2e/admin/${folderName}/**/*.cy.{js,jsx,ts,tsx}`);
    }
}

console.log(JSON.stringify(packagesWithTests));
