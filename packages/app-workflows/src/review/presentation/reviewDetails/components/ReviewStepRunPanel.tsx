import React from "react";
import { createReactiveComponent } from "@webiny/app-admin";
import { Alert } from "@webiny/admin-ui";
import { Dialog } from "@webiny/admin-ui";
import { Text } from "@webiny/admin-ui";
import type { ReviewDetailsPresenter } from "../abstractions.js";
import { STEP_RUN_GONE_TEXT } from "../getStepRunPanel.js";
import { STEP_RUN_PANEL_TITLE } from "../getStepRunPanel.js";

export interface ReviewStepRunPanelProps {
    presenter: ReviewDetailsPresenter.Interface;
}

/*
 * The background task of an attempt (R257, R264): status, times, iterations and the fixed reason,
 * or "This task is no longer available." A modal over the drawer, closed with Close or Escape;
 * everything it shows comes from the presenter's `vm.stepRun`.
 */
export const ReviewStepRunPanel = createReactiveComponent(function ReviewStepRunPanel(
    props: ReviewStepRunPanelProps
) {
    const { presenter } = props;
    const panel = presenter.vm.stepRun;

    if (!panel.open) {
        return null;
    }

    return (
        <Dialog
            open={true}
            onOpenChange={open => {
                if (!open) {
                    presenter.closeStepRun();
                }
            }}
            title={STEP_RUN_PANEL_TITLE}
            loading={panel.loading}
            actions={<Dialog.CancelAction text={"Close"} />}
        >
            <div data-role={"step-run-panel"} className={"flex flex-col gap-md"}>
                {panel.error !== null && (
                    <Alert type={"danger"} variant={"subtle"}>
                        {panel.error}
                    </Alert>
                )}
                {panel.gone && <Text size={"md"}>{STEP_RUN_GONE_TEXT}</Text>}
                {panel.rows.length > 0 && (
                    <div className={"grid grid-cols-[120px_1fr] gap-x-md gap-y-xs text-sm"}>
                        {panel.rows.map(row => (
                            <React.Fragment key={row.label}>
                                <span className={"text-neutral-muted"}>{row.label}</span>
                                <span>{row.value}</span>
                            </React.Fragment>
                        ))}
                    </div>
                )}
            </div>
        </Dialog>
    );
});
