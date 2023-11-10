import React from "react";

import { OptionsMenu } from "@webiny/app-admin";
import { useAcoConfig } from "~/config";

import { Container } from "./styled";

export const MenuActions = () => {
    const { folder: folderConfig } = useAcoConfig();

    return (
        <Container className={"folder-tree-menu-action"}>
            <OptionsMenu actions={folderConfig.actions} data-testid={"folder.tree.menu-action"} />
        </Container>
    );
};
