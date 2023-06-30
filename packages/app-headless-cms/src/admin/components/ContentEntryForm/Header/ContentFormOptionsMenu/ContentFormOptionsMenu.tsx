import React from "react";
import { OptionsMenu } from "@webiny/app-admin";

import { useContentEntryEditorConfig } from "~/admin/config/contentEntries";
import { OptionMenuContainer } from "./ContentFormOptionsMenu.styles";

export const ContentFormOptionsMenu: React.VFC = () => {
    const { actions } = useContentEntryEditorConfig();

    return (
        <OptionMenuContainer>
            <OptionsMenu
                actions={actions.filter(action => action.$type === "menu-item-action")}
                data-testid={"cms.content-form.header.more-options"}
            />
        </OptionMenuContainer>
    );
};
