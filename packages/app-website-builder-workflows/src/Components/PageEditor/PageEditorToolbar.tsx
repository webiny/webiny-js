import { EditorConfig } from "@webiny/app-website-builder/BaseEditor/index.js";
import React from "react";
import { useSelectFromDocument } from "@webiny/app-website-builder/BaseEditor/hooks/useSelectFromDocument.js";

export const PageEditorToolbar = EditorConfig.Ui.Toolbar.createDecorator(Original => {
    return function PageEditorToolbarDecorated() {
        const stepId = useSelectFromDocument((document): string | undefined => {
            // @ts-expect-error
            return document.workflows?.state?.stepId;
        });
        if (stepId) {
            return null;
        }
        return <Original />;
    };
});
