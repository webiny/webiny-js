import React from "react";

import { i18n } from "@webiny/app/i18n";

import { Button, Icon, IconContainer } from "./styled";

type Props = {
    onClick: () => void;
};

const t = i18n.ns("app-folders/components/tree/button-create");

export const CreateButton: React.FC<Props> = ({ onClick }) => {
    return (
        <Button onClick={onClick}>
            <IconContainer>
                <Icon />
            </IconContainer>
            {t`Create new folder`}
        </Button>
    );
};
