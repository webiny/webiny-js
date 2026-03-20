import { IsModelPublishable } from "@webiny/app-headless-cms/exports/admin/cms.js";
import { ContentEntryEditorConfig } from "@webiny/app-headless-cms/exports/admin/cms/entry/editor.js";
import React from "react";
import { MenuItem } from "./MenuItem.js";

const { Actions } = ContentEntryEditorConfig;

export const EditorConfig = () => {
    return (
        <ContentEntryEditorConfig>
            <IsModelPublishable>
                <Actions.MenuItemAction name={"schedule"} element={<MenuItem />} />
            </IsModelPublishable>
        </ContentEntryEditorConfig>
    );
};
