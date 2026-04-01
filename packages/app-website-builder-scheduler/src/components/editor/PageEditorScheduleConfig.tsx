import React from "react";
import { PageEditorConfig } from "@webiny/app-website-builder/exports/admin/website-builder/page/editor.js";
import { HasPermission } from "@webiny/app-website-builder/exports/admin/website-builder.js";
import { PageEditorScheduleMenuItem } from "./PageEditorScheduleMenuItem.js";

const { DropdownAction } = PageEditorConfig.Ui.TopBar;

export const PageEditorScheduleConfig = () => {
    return (
        <HasPermission entity={"page"} someActions={["publish", "unpublish"]}>
            <PageEditorConfig>
                <DropdownAction name={"scheduler"} element={<PageEditorScheduleMenuItem />} />
            </PageEditorConfig>
        </HasPermission>
    );
};
