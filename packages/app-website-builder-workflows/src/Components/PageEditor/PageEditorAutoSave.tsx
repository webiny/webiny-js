import React from "react";
import { useFeature } from "@webiny/app";
import { createReactiveComponent } from "@webiny/app-admin";
import { PageEditorConfig } from "@webiny/app-website-builder/presentation/pages/PageEditor/PageEditorConfig.js";
import { WbPageReviewFeature } from "~/features/editorReview/feature.js";

const { Ui } = PageEditorConfig;

interface AutoSaveGateProps {
    element?: React.ReactElement | null;
}

const AutoSaveGate = createReactiveComponent((props: AutoSaveGateProps) => {
    const { session } = useFeature(WbPageReviewFeature);

    /*
     * Autosave runs only while editing is allowed: never while a review exists and never while the
     * review status is loading or failed.
     */
    if (session.presenter.vm.allowsEditing) {
        return props.element ?? null;
    }

    return null;
});

export const PageEditorAutoSave = Ui.TopBar.Element.createDecorator(Original => {
    return function PageEditorAutoSaveDecorated(props) {
        if (props.name === "autoSave") {
            return <Original {...props} element={<AutoSaveGate element={props.element} />} />;
        }
        return <Original {...props} />;
    };
});
