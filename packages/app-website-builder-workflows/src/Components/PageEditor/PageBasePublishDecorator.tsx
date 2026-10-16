import React from "react";
import { useFeature } from "@webiny/app";
import { createReactiveComponent } from "@webiny/app-admin";
import { PageEditorConfig } from "@webiny/app-website-builder/presentation/pages/PageEditor/PageEditorConfig.js";
import { WbPageReviewFeature } from "~/features/editorReview/feature.js";

const { Ui } = PageEditorConfig;

interface BasePublishGateProps {
    element?: React.ReactElement | null;
}

const BasePublishGate = createReactiveComponent((props: BasePublishGateProps) => {
    const { session } = useFeature(WbPageReviewFeature);

    if (session.presenter.vm.status === "noWorkflow") {
        return props.element ?? null;
    }

    return null;
});

/*
 * Hides the base Publish for every page of a namespace that has a workflow; the workflows Publish
 * (`buttonWorkflowPublish`) takes over there. The one decoration of `buttonPublish` (A78).
 */
export const PageBasePublishDecorator = Ui.TopBar.Action.createDecorator(Original => {
    return function PageBasePublishDecoratorAction(props) {
        if (props.name === "buttonPublish") {
            return <Original {...props} element={<BasePublishGate element={props.element} />} />;
        }
        return <Original {...props} />;
    };
});
