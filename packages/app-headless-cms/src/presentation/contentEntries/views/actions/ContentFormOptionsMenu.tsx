import React from "react";
import { OptionsMenu } from "@webiny/app-admin";
import { useContentEntryEditorConfig } from "~/admin/config/contentEntries/index.js";

export const ContentFormOptionsMenu = () => {
    const { menuItemActions } = useContentEntryEditorConfig();

    return (
        <OptionsMenu
            actions={menuItemActions}
            data-testid={"cms.content-form.header.more-options"}
        />
    );
};
