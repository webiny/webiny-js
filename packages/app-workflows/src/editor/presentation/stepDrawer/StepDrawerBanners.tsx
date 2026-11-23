import React from "react";
import { Alert } from "@webiny/admin-ui";
import { Heading } from "@webiny/admin-ui";
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
    // The tab the form has open, or null when the form has no tabs.
    activeTabId: string | null;
    onShowErrorTab(): void;
}

/*
 * What sits above the form in the step drawer, in the order of the design: the licence alert, the
 * teams-off notice, the error with no field and the banner for an error on another tab. The
 * `Check this step` block is gone (B23): errors and warnings show at their fields and as counts on
 * the tabs. Plain props, no state (the presenter owns it, R234).
 */
export const StepDrawerBanners = (props: StepDrawerBannersProps) => {
    const { licenceAlert, notice, topError, errorTab, activeTabId } = props;

    let showTabBanner = false;
    if (errorTab !== null && activeTabId !== null) {
        showTabBanner = activeTabId !== STEP_DRAWER_TAB[errorTab];
    }

    return (
        <>
            {licenceAlert && (
                <Alert type={"warning"} variant={"subtle"}>
                    <Heading level={6}>{licenceAlert.title}</Heading>
                    {licenceAlert.text}
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
        </>
    );
};
