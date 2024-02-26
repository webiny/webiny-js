const uniqid = require("uniqid");
const del = require("del");
const lodashSome = require("lodash/some");
const { addMatchImageSnapshotPlugin } = require("cypress-image-snapshot/plugin");

module.exports = (on, config) => {
    config.env.TEST_RUN_ID = uniqid();
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

    addMatchImageSnapshotPlugin(on, config);

    return config;
};
