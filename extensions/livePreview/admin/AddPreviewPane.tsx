import React from "react";
import { PreviewPane } from "./PreviewPane";
import { getPreviewUrl } from "./getPreviewUrl";
import { ContentEntryForm } from "webiny/admin/cms/entry/editor";
import { useModel } from "webiny/admin/cms";

export const AddPreviewPane = ContentEntryForm.createDecorator(Original => {
    return function ContentEntryForm(props) {
        const { model } = useModel();

        if (model.modelId !== "article") {
            return <Original {...props} />;
        }

        return (
            <div
                data-role={"live-preview-pane"}
                className="flex w-[95vw] h-[calc(100vh-var(--spacing-header)-200px)]"
            >
                <PreviewPane previewUrl={getPreviewUrl(window.location.origin)} />
                <div className="flex-1">
                    <Original {...props} />
                </div>
            </div>
        );
    };
});
