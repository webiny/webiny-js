import React from "react";
import { RegisterFeature } from "@webiny/app-admin/components/RegisterFeature.js";
import { BugReportFeature } from "./feature.js";
import { BugReportMount } from "./BugReportMount.js";

/**
 * Admin entry point, loaded by `<Admin.Extension>` from `BugReporter.tsx`.
 *
 * Hit cmd+shift+b (or find "Report a bug" in the command palette), say what went wrong, paste a
 * screenshot, and the report goes to the API. Only reachable when the `bugReporter` feature flag
 * is on, since the flag gates registration at composition time.
 *
 * See ../../README.md for setup.
 */
export default function BugReporterAdminExtension() {
    return (
        <>
            <RegisterFeature feature={BugReportFeature} />
            <BugReportMount />
        </>
    );
}
