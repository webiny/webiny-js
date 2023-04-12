import React from "react";

import { i18n } from "@webiny/app/i18n";

import { Container } from "./styled";
import { Typography } from "@webiny/ui/Typography";

const t = i18n.ns("app-aco/components/tags/empty");

type EmptyProps = {
    disclaimer?: string;
};

export const Empty = ({ disclaimer = t`No tags found...` }: EmptyProps) => {
    return (
        <Container>
            <Typography use={"body2"}>{disclaimer}</Typography>
        </Container>
    );
};
