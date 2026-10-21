import React from "react";
import { PageEditorConfig as BaseConfig } from "@webiny/app-website-builder/presentation/pages/PageEditor/PageEditorConfig.js";
import { PageEditorTopBar } from "./PageEditorTopBar.js";
import { PageEditorLayout } from "./PageEditorLayout.js";
import { PageNewRevisionDecorator } from "./PageNewRevisionDecorator.js";
import { PageEditorAutoSave } from "./PageEditorAutoSave.js";
import { PageBasePublishDecorator } from "./PageBasePublishDecorator.js";
import { PageReviewPublishAction } from "./PageReviewPublishAction.js";

export const PageEditorConfig = () => {
    return (
        <>
            {/* The review bar under the top bar, for every page status. */}
            <PageEditorTopBar />
            {/* The one source of the canvas read-only flag. */}
            <PageEditorLayout />
            {/* New Revision hidden while a review is in progress or its state is unknown. */}
            <PageNewRevisionDecorator />
            {/* Autosave only while editing is allowed. */}
            <PageEditorAutoSave />
            {/* Hide the base Publish where a workflow exists. */}
            <PageBasePublishDecorator />
            <BaseConfig>
                {/* Publish that does not depend on the canvas being editable. */}
                <PageReviewPublishAction />
            </BaseConfig>
        </>
    );
};
