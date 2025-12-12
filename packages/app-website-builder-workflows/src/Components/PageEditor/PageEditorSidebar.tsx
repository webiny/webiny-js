import React from "react";
import { EditorConfig } from "@webiny/app-website-builder/BaseEditor/index.js";
import { useSelectFromDocument } from "@webiny/app-website-builder/BaseEditor/hooks/useSelectFromDocument.js";

export const PageEditorSidebar = EditorConfig.Ui.Sidebar.createDecorator(Original => {
    return function PageEditorSidebarDecorated() {
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
