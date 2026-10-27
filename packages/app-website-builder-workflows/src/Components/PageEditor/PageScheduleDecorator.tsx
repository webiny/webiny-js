import React from "react";
import { useFeature } from "@webiny/app";
import { createReactiveComponent } from "@webiny/app-admin";
import { PageEditorConfig } from "@webiny/app-website-builder/presentation/pages/PageEditor/PageEditorConfig.js";
import { WbPageReviewFeature } from "~/features/editorReview/feature.js";

const { Ui } = PageEditorConfig;

interface ScheduleGateProps {
    element?: React.ReactElement | null;
}

const ScheduleGate = createReactiveComponent((props: ScheduleGateProps) => {
    const { session } = useFeature(WbPageReviewFeature);

    if (!session.presenter.vm.allowsPublishing) {
        return null;
    }

    return props.element ?? null;
});

/*
 * Scheduling a publish needs what publishing needs, so the scheduler's "Schedule" dropdown
 * action (only present when the scheduler is installed) is hidden unless the review allows
 * publishing; every other dropdown action passes through.
 */
export const PageScheduleDecorator = Ui.TopBar.DropdownAction.createDecorator(Original => {
    return function PageScheduleDecoratorAction(props) {
        if (props.name === "scheduler") {
            return <Original {...props} element={<ScheduleGate element={props.element} />} />;
        }
        return <Original {...props} />;
    };
});
