import React, { useEffect } from "react";
import { createReactiveComponent } from "webiny/admin";
import { useFeature } from "webiny/admin";
import { BugReportFeature } from "./feature.js";
import { ReportBugDialog } from "./presentation/report/ReportBugDialog.js";
import { BugReportSettingsDialog } from "./presentation/settings/BugReportSettingsDialog.js";

/*
 * Always mounted, so the recorder is running long before anyone decides something is broken,
 * and both dialogs live outside the command palette (which has to close before we screenshot).
 */
export const BugReportMount = createReactiveComponent(function BugReportMount() {
    const { recorder } = useFeature(BugReportFeature);

    useEffect(() => {
        recorder.start();
        return () => recorder.stop();
    }, [recorder]);

    return (
        <>
            <ReportBugDialog />
            <BugReportSettingsDialog />
        </>
    );
});
