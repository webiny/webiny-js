import React from "react";
import { Icon } from "@webiny/ui/Icon";
import { EmptyIcon, EmptyOuter, EmptyTitle, EmptyWrapper } from "./Empty.styled";

export const Empty = () => {
    return (
        <EmptyWrapper>
            <EmptyOuter>
                <Icon icon={<EmptyIcon />} />
                <EmptyTitle use={"headline6"}>{"No items found."}</EmptyTitle>
            </EmptyOuter>
        </EmptyWrapper>
    );
};
