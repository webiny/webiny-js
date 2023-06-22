import React from "react";

import { i18n } from "@webiny/app/i18n";
import { Typography } from "@webiny/ui/Typography";

import { Button, Icon, IconContainer } from "./styled";

type CreateButtonProps = {
    onClick: () => void;
};

const t = i18n.ns("app-aco/components/folder-tree/button-create");

export const CreateButton: React.VFC<CreateButtonProps> = ({ onClick }) => {
    return (
        <Button onClick={onClick}>
            <IconContainer>
                <Icon />
            </IconContainer>
            <Typography use={"subtitle2"}>{t`Create a new folder`}</Typography>
        </Button>
    );
};
