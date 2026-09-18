import React from "react";
import { RegisterFeature } from "@webiny/app-admin/components/RegisterFeature.js";
import { BugReportFeature } from "./feature.js";
import { BugReportMount } from "./BugReportMount.js";

/**
 * Admin entry point, loaded by `<Admin.Extension>` from `BugReporter.tsx`.
 *
 * Hit cmd+shift+b (or find "Report a bug" in the command palette), say what went wrong, paste a
 * screenshot, and the report goes to the API.
 */
export const Extension = () => {
    return (
        <>
            <RegisterFeature feature={BugReportFeature} />
            <BugReportMount />
        </>
    );
};
