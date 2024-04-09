import React from "react";

import { i18n } from "@webiny/app/i18n";
import { Typography } from "@webiny/ui/Typography";

import { Container } from "./styled";

const t = i18n.ns("app-aco/components/folder-tree/empty");

export const Empty = () => {
    return (
        <Container>
            <Typography use={"body2"}>{t`No folders found...`}</Typography>
        </Container>
    );
};
