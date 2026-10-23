import React from "react";
import { Alert } from "@webiny/admin-ui";
import { cn } from "@webiny/admin-ui";
import type { StepWarningLine } from "~/editor/model/StepWarningLine.js";
import type { StepDrawerAlertVm } from "./abstractions.js";
import { STEP_DRAWER_MESSAGES } from "./stepDrawerMessages.js";
import { STEP_DRAWER_TAB } from "./stepDrawerTabs.js";
import { STEP_ERROR_TAB_LABELS } from "./stepDrawerTabs.js";
import type { StepErrorTab } from "./stepDrawerTabs.js";

export interface StepDrawerBannersProps {
    licenceAlert: StepDrawerAlertVm | null;
    // The teams-off notice (R309).
    notice: string | null;
    topError: string | null;
    // The tab holding an error (R302), or null.
    errorTab: StepErrorTab | null;
    // The `Check this step` lines (R312), each with its severity.
    warnings: StepWarningLine[];
    // The tab the form has open, or null when the form has no tabs.
    activeTabId: string | null;
    onShowErrorTab(): void;
}

/*
 * What sits above the form in the step drawer, in the order of the design: the licence alert, the
 * teams-off notice, the error with no field, the banner for an error on another tab and the
 * `Check this step` block. Plain props, no state (the presenter owns it, R234).
 */
export const StepDrawerBanners = (props: StepDrawerBannersProps) => {
    const { licenceAlert, notice, topError, errorTab, warnings, activeTabId } = props;

    let showTabBanner = false;
    if (errorTab !== null && activeTabId !== null) {
        showTabBanner = activeTabId !== STEP_DRAWER_TAB[errorTab];
    }
    const showWarnings = warnings.length > 0 && activeTabId !== STEP_DRAWER_TAB.testRouting;

    return (
        <>
            {licenceAlert && (
                <Alert type={"warning"} variant={"subtle"}>
                    <strong>{licenceAlert.title}</strong> {licenceAlert.text}
                </Alert>
            )}
            {notice !== null && (
                <Alert type={"info"} variant={"subtle"}>
                    {notice}
                </Alert>
            )}
            {topError && (
                <Alert type={"danger"} variant={"subtle"}>
                    {topError}
                </Alert>
            )}
            {showTabBanner && errorTab !== null && (
                <Alert
                    type={"danger"}
                    variant={"subtle"}
                    actions={
                        <Alert.Action
                            text={STEP_DRAWER_MESSAGES.show}
                            onClick={props.onShowErrorTab}
                        />
                    }
                >
                    {STEP_DRAWER_MESSAGES.errorOnTab(STEP_ERROR_TAB_LABELS[errorTab])}
                </Alert>
            )}
            {showWarnings && (
                <Alert type={"warning"} variant={"subtle"}>
                    <strong>{STEP_DRAWER_MESSAGES.warningsHeading}</strong>
                    <ul className={"mt-xs flex flex-col gap-xxs"}>
                        {warnings.map((line, index) => (
                            <li
                                key={`${index}:${line.text}`}
                                data-severity={line.severity}
                                className={cn(
                                    line.severity === "error" && "text-destructive-primary"
                                )}
                            >
                                {line.text}
                            </li>
                        ))}
                    </ul>
                </Alert>
            )}
        </>
    );
};
