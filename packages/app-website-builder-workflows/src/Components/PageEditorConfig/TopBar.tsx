import React from "react";
import { PageEditorConfig } from "@webiny/app-website-builder";
import { WorkflowStateBar } from "./WorkflowStateBar.js";
import { useSelectFromDocument } from "@webiny/app-website-builder/BaseEditor/hooks/useSelectFromDocument.js";

const { Ui } = PageEditorConfig;

export const TopBar = Ui.TopBar.Layout.createDecorator(Original => {
    return function TopBarWorkflowsState() {

        const page = useSelectFromDocument(doc => {
            return {
                id: doc.id,
                title: doc.properties.title || "unknown page"
            };
        });
        
        return (
            <>
                <Original />
                <WorkflowStateBar page={page} />
            </>
        );
    };
});
