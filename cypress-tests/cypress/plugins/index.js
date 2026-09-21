const uniqid = require("uniqid");
const del = require("del");
const lodashSome = require("lodash/some");

module.exports = (on, config) => {
    /**
     * Generated per run and read by specs through `Cypress.expose`, so it belongs in `expose`
     * rather than `env` - Cypress 16 split the two, and `env` is now reachable only through the
     * asynchronous `cy.env()`.
     */
    config.expose = { ...config.expose, TEST_RUN_ID: uniqid() };
    /*
     * Only keep video recording file for failed Spec.
     * This will help reducing media noise in the Slack channel posted by Github action.
     */
    on("after:spec", (spec, results) => {
        if (results && results.video) {
            // Do we have failures for any retry attempts?
            const failures = lodashSome(results.tests, test => {
                return lodashSome(test.attempts, { state: "failed" });
            });
            if (!failures) {
                // delete the video if the spec passed and no tests retried
                return del(results.video);
            }
        }
    });

    return config;
};
