import "./login";
import "./dropFile";
import "./reloadUntil";
import "./pageBuilder/pbCreatePage";
import "./pageBuilder/pbUpdatePage";
import "./pageBuilder/pbPublishPage";

Cypress.Commands.overwrite("visit", (orig, url, options) => {
    return orig(url, { ...options, failOnStatusCode: false });
});
