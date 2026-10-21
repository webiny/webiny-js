import React from "react";
import { PageEditorConfig } from "@webiny/app-website-builder/presentation/pages/PageEditor/PageEditorConfig.js";
import { HasPermission } from "@webiny/app-website-builder/presentation/security/HasPermission.js";
import { PageReviewPublishButton } from "./PageReviewPublishButton.js";

const { Ui } = PageEditorConfig;

/*
 * Registered outside `Ui.IsNotReadOnly` on purpose: the base Publish is mounted only while the
 * canvas is editable, and an approved revision is read-only (A73).
 */
export const PageReviewPublishAction = () => {
    return (
        <Ui.TopBar.Action
            name={"buttonWorkflowPublish"}
            element={
                <HasPermission entity={"page"} action={"publish"}>
                    <PageReviewPublishButton />
                </HasPermission>
            }
        />
    );
};
