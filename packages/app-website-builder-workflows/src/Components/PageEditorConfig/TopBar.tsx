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
                <div className={"max-w-screen bg-white pt-sm pb-sm"}>
                    <div className={"max-w-[960px] mx-auto"}>
                        <WorkflowStateBar page={page} />
                    </div>
                </div>
            </>
        );
    };
});
