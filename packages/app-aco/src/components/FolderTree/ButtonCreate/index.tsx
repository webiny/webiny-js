import React from "react";

import { i18n } from "@webiny/app/i18n";
import { Typography } from "@webiny/ui/Typography";

import { useCreateDialog } from "~/dialogs";
import { Button, Icon, IconContainer } from "./styled";

type CreateButtonProps = {
    disabled?: boolean;
};

const t = i18n.ns("app-aco/components/folder-tree/button-create");

export const CreateButton = (props: CreateButtonProps) => {
    const { showDialog } = useCreateDialog();

    return (
        <Button onClick={() => showDialog()} disabled={props.disabled}>
            <IconContainer>
                <Icon />
            </IconContainer>
            <Typography use={"subtitle2"}>{t`Create a new folder`}</Typography>
        </Button>
    );
};
