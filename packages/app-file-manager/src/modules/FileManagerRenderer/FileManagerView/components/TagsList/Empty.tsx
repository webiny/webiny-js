import React from "react";
import { Typography } from "@webiny/ui/Typography";
import { EmptyContainer } from "./styled";

type EmptyProps = {
    disclaimer?: string;
};

export const Empty = ({ disclaimer = `No tags found...` }: EmptyProps) => {
    return (
        <EmptyContainer>
            <Typography use={"body2"}>{disclaimer}</Typography>
        </EmptyContainer>
    );
};
