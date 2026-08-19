import React from "react";
import { InternalContentEntryEditorConfig } from "@webiny/app-headless-cms";
import { IsModelPublishable } from "@webiny/app-headless-cms/exports/admin/cms.js";
import { MenuItem } from "./MenuItem.js";

const { Actions } = InternalContentEntryEditorConfig;

export const EditorConfig = () => {
    return (
        <InternalContentEntryEditorConfig>
            <IsModelPublishable>
                <Actions.MenuItemAction name={"schedule"} element={<MenuItem />} />
            </IsModelPublishable>
        </InternalContentEntryEditorConfig>
    );
};
