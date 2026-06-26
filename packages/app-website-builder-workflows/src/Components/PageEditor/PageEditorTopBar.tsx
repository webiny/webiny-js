import React, { useEffect } from "react";
import { PageEditorConfig } from "@webiny/app-website-builder";
import {
    type EditorDocument,
    useSelectFromDocument
} from "@webiny/app-website-builder/BaseEditor/hooks/useSelectFromDocument.js";
import { useWorkflowState } from "@webiny/app-workflows";
import { WB_PAGE_APP } from "~/constants.js";
import { PageFormWorkflowState } from "~/Components/PageEditor/PageFormWorkflowState.js";
import { ToggleEditorMode } from "~/Components/PageEditor/ToggleEditorMode.js";
import { WbPageStatus, type WbStatus } from "@webiny/app-website-builder/constants.js";

const { Ui } = PageEditorConfig;

interface PageEditorTopBarEditorDocument extends EditorDocument {
    status: WbStatus;
}

interface ISelectedPage {
    id: string;
    title: string;
    status: WbStatus;
}

export const PageEditorTopBar = Ui.TopBar.Layout.createDecorator(Original => {
    return function PageEditorTopBarWorkflowsState() {
        const page = useSelectFromDocument<ISelectedPage, PageEditorTopBarEditorDocument>(doc => {
            return {
                id: doc.id,
                title: doc.properties.title || "unknown page",
                status: doc.status || "draft"
            };
        });

        const { presenter } = useWorkflowState();

        useEffect(() => {
            if (page.status === WbPageStatus.Draft) {
                presenter.init(WB_PAGE_APP, page.id, `Website Builder: ${page.title}`);
            }
            return () => presenter.dispose();
        }, [page.id, page.status]);

        return (
            <>
                <Original />
                <ToggleEditorMode />
                <PageFormWorkflowState />
            </>
        );
    };
});
