import React from "react";

import { i18n } from "@webiny/app/i18n";
import { Typography } from "@webiny/ui/Typography";

import { EmptyContainer } from "./styled";

const t = i18n.ns("app-aco/tag-list/empty");

type EmptyProps = {
    disclaimer?: string;
};

export const Empty = ({ disclaimer = t`No tags found...` }: EmptyProps) => {
    return (
        <EmptyContainer>
            <Typography use={"body2"}>{disclaimer}</Typography>
        </EmptyContainer>
    );
};
