import React from "react";
import { RegisterFeature } from "webiny/admin";
import { BugReportFeature } from "./feature.js";
import { BugReportMount } from "./BugReportMount.js";

/**
 * Report a bug by talking to the app.
 *
 * Hit cmd+shift+b (or find "Report a bug" in the command palette), say what went wrong, and
 * the extension files a GitHub issue with a screenshot, the environment, and a timeline of
 * what you did in the minutes before. Internal to this repo: it is registered in
 * webiny.config.tsx, which projects created from Webiny do not get.
 *
 * See ./README.md for setup.
 */
export default () => {
    return (
        <>
            <RegisterFeature feature={BugReportFeature} />
            <BugReportMount />
        </>
    );
};
