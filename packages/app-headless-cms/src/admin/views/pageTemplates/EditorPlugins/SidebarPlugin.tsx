import React, { useCallback } from "react";
import { css } from "emotion";
import { createComponentPlugin } from "@webiny/app-admin";
import { Editor } from "~/admin/components/ContentModelEditor";
import { plugins } from "@webiny/plugins";
import { CmsEditorFieldTypePlugin } from "~/types";
import { ReactComponent as ObjectIcon } from "~/admin/icons/ballot_black_24dp.svg";
import { useContentModelEditor } from "~/admin/components/ContentModelEditor/useContentModelEditor";

const makeScrollable = css`
    overflow: scroll;
    height: calc(100vh - 70px);
`;

export const SidebarPlugin = createComponentPlugin(Editor.Sidebar, OriginalSidebar => {
    return function Sidebar({ children, ...props }) {
        const { tabsRef } = useContentModelEditor();

        const onFieldDragStart = useCallback(() => {
            if (tabsRef.current!.getActiveIndex() > 1) {
                tabsRef.current!.switchTab(0);
            }
        }, []);

        const modelFields = plugins
            .byType<CmsEditorFieldTypePlugin>("cms-editor-field-type")
            .filter(pl => pl.tags?.includes("content-model"));

        return (
            <OriginalSidebar {...props} className={makeScrollable}>
                <Editor.FieldsList
                    title={"Content Models"}
                    icon={<ObjectIcon />}
                    onFieldDragStart={onFieldDragStart}
                    fieldTypePlugins={modelFields}
                />
                {children}
            </OriginalSidebar>
        );
    };
});
