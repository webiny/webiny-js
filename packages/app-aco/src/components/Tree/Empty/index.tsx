import React from "react";

import { i18n } from "@webiny/app/i18n";

import { Container } from "./styled";
import { Typography } from "@webiny/ui/Typography";

const t = i18n.ns("app-aco/components/tree/empty");

export const Empty = () => {
    return (
        <Container>
            <Typography use={"body2"}>{t`No folders found...`}</Typography>
        </Container>
    );
};
