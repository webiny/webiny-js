import React from "react";
import { useFeature } from "@webiny/app";
import { createReactiveComponent } from "@webiny/app-admin";
import { useSelectFromDocument } from "@webiny/app-website-builder/BaseEditor/hooks/useSelectFromDocument.js";
import { WbPageStatus } from "@webiny/app-website-builder/constants.js";
import type { WbStatus } from "@webiny/app-website-builder/constants.js";
import { PageEditorConfig } from "@webiny/app-website-builder/presentation/pages/PageEditor/PageEditorConfig.js";
import { WbPageReviewFeature } from "~/features/editorReview/feature.js";
import type { IPageEditorDocument } from "./pageEditorDocument.js";

const { Ui } = PageEditorConfig;

interface ScheduleGateProps {
    element?: React.ReactElement | null;
}

const selectStatus = (doc: IPageEditorDocument): WbStatus => {
    return doc.status || WbPageStatus.Draft;
};

const ScheduleGate = createReactiveComponent((props: ScheduleGateProps) => {
    const { session } = useFeature(WbPageReviewFeature);
    const pageStatus = useSelectFromDocument<WbStatus, IPageEditorDocument>(selectStatus);

    // A published page schedules an unpublish, which no review blocks.
    if (pageStatus !== WbPageStatus.Published && !session.presenter.vm.allowsPublishing) {
        return null;
    }

    return props.element ?? null;
});

/*
 * Scheduling a publish needs what publishing needs (the API refuses the schedule with
 * `Workflows/Review/PublishBlocked` otherwise), so the scheduler's "Schedule" dropdown action
 * (only present when the scheduler is installed) is hidden unless the review allows publishing or
 * the page is published (the dialog then schedules an unpublish); every other dropdown action
 * passes through.
 */
export const PageScheduleDecorator = Ui.TopBar.DropdownAction.createDecorator(Original => {
    return function PageScheduleDecoratorAction(props) {
        if (props.name === "scheduler") {
            return <Original {...props} element={<ScheduleGate element={props.element} />} />;
        }
        return <Original {...props} />;
    };
});
