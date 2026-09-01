import uniqid from "uniqid";
import { deleteSync } from "del";
import some from "lodash/some.js";
import { addMatchImageSnapshotPlugin } from "cypress-image-snapshot/plugin.js";
import vitePreprocessor from "cypress-vite";

export default (on, config) => {
    on(
        "file:preprocessor",
        vitePreprocessor({
            define: {
                global: "window"
            }
        })
    );
    config.env.TEST_RUN_ID = uniqid();
    /*
     * Only keep video recording file for failed Spec.
     * This will help reducing media noise in the Slack channel posted by Github action.
     */
    on("after:spec", (spec, results) => {
        if (results && results.video) {
            // Do we have failures for any retry attempts?
            const failures = some(results.tests, test => {
                return some(test.attempts, { state: "failed" });
            });
            if (!failures) {
                // delete the video if the spec passed and no tests retried
                return deleteSync(results.video);
            }
        }
    });

    addMatchImageSnapshotPlugin(on, config);

    return config;
};
