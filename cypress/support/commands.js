import "./login";
import "./dropFile";
import "./reloadUntil";

Cypress.Commands.overwrite("visit", (orig, url, options) => {
    return orig(url, { ...options, failOnStatusCode: false });
});
