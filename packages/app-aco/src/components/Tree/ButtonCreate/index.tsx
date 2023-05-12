import React from "react";

import { i18n } from "@webiny/app/i18n";
import { Typography } from "@webiny/ui/Typography";

import { Button, Icon, IconContainer } from "./styled";

type Props = {
    onClick: () => void;
};

const t = i18n.ns("app-aco/components/tree/button-create");

export const CreateButton: React.FC<Props> = ({ onClick }) => {
    return (
        <Button onClick={onClick}>
            <IconContainer>
                <Icon />
            </IconContainer>
            <Typography use={"subtitle2"}>{t`Create new folder`}</Typography>
        </Button>
    );
};
