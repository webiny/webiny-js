import React, { useEffect } from "react";
import { createReactiveComponent } from "@webiny/app-admin";
import { useFeature } from "@webiny/app/shared/di/useFeature.js";
import { Plugin } from "@webiny/app/core/Plugin.js";
import { BugReportFeature } from "./feature.js";
import { ReportBugDialog } from "./presentation/report/ReportBugDialog.js";

/*
 * Always mounted, so the recorder is running long before anyone decides something is broken,
 * and the dialog lives outside the command palette (which has to close before we screenshot).
 *
 * The dialog goes through <Plugin> rather than being rendered here. An extension's children are
 * rendered by <App> BEFORE the provider stack, so anything drawn directly from this component
 * sits outside AdminUiProvider and every admin-ui form component throws. Plugins are collected
 * and re-rendered inside the providers, which is where UI belongs.
 */
export const BugReportMount = createReactiveComponent(function BugReportMount() {
    const { recorder } = useFeature(BugReportFeature);

    useEffect(() => {
        recorder.start();
        return () => recorder.stop();
    }, [recorder]);

    return (
        <Plugin>
            <ReportBugDialog />
        </Plugin>
    );
});
