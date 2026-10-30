import React from "react";
import { useFeature } from "@webiny/app";
import { createReactiveComponent } from "@webiny/app-admin";
import { PageEditorConfig } from "@webiny/app-website-builder/presentation/pages/PageEditor/PageEditorConfig.js";
import { WbPageReviewFeature } from "~/features/editorReview/feature.js";

const { Ui } = PageEditorConfig;

interface NewRevisionGateProps {
    element?: React.ReactElement | null;
}

const NewRevisionGate = createReactiveComponent((props: NewRevisionGateProps) => {
    const { session } = useFeature(WbPageReviewFeature);
    const { vm } = session.presenter;

    /*
     * Hidden while the status is unknown (R225) and while a review is in progress (Q17). Shown
     * for a rejected, an approved and an unpublished page (Q19) and where there is no workflow.
     */
    if (vm.status === "loading" || vm.status === "failed" || vm.reviewKind === "inProgress") {
        return null;
    }

    return props.element ?? null;
});

/*
 * The one decoration of the base `buttonNewRevision` (A78); every other action passes through.
 */
export const PageNewRevisionDecorator = Ui.TopBar.Action.createDecorator(Original => {
    return function PageNewRevisionDecoratorAction(props) {
        if (props.name === "buttonNewRevision") {
            return <Original {...props} element={<NewRevisionGate element={props.element} />} />;
        }
        return <Original {...props} />;
    };
});
