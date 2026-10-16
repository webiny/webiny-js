import React from "react";
import { useFeature } from "@webiny/app";
import { createReactiveComponent } from "@webiny/app-admin";
import { useSelectFromDocument } from "@webiny/app-website-builder/BaseEditor/hooks/useSelectFromDocument.js";
import { WbPageStatus } from "@webiny/app-website-builder/constants.js";
import type { WbStatus } from "@webiny/app-website-builder/constants.js";
import { PublishButton } from "@webiny/app-website-builder/presentation/pages/PageEditor/TopBar/PublishButton.js";
import { WbPageReviewFeature } from "~/features/editorReview/feature.js";
import { DisabledPublishButton } from "./DisabledPublishButton.js";
import type { IPageEditorDocument } from "./pageEditorDocument.js";

const selectStatus = (doc: IPageEditorDocument): WbStatus => {
    return doc.status || WbPageStatus.Draft;
};

/*
 * Publish for every namespace that has a workflow. It does not depend on the canvas being editable:
 * an approved revision is read-only and still publishes (A73).
 */
export const PageReviewPublishButton = createReactiveComponent(() => {
    const { session } = useFeature(WbPageReviewFeature);
    const pageStatus = useSelectFromDocument<WbStatus, IPageEditorDocument>(selectStatus);
    const { vm } = session.presenter;

    if (vm.status === "noWorkflow") {
        return null;
    }

    if (pageStatus === WbPageStatus.Published) {
        return null;
    }

    if (vm.allowsPublishing) {
        return <PublishButton />;
    }

    return <DisabledPublishButton presenter={session.presenter} />;
});
