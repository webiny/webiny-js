import React from "react";

import { i18n } from "@webiny/app/i18n";
import { Typography } from "@webiny/ui/Typography";

import { useCreateDialog } from "~/dialogs";
import { Button, Icon, IconContainer } from "./styled";

const t = i18n.ns("app-aco/components/folder-tree/button-create");

export const CreateButton = () => {
    const { showDialog } = useCreateDialog();

    return (
        <Button onClick={() => showDialog({})}>
            <IconContainer>
                <Icon />
            </IconContainer>
            <Typography use={"subtitle2"}>{t`Create a new folder`}</Typography>
        </Button>
    );
};
