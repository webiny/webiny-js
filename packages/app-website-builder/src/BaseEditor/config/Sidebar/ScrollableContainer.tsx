import React from "react";
import { ScrollArea } from "@webiny/admin-ui";

export const ScrollableContainer = ({ children }: any) => {
    return (
        <ScrollArea className={"h-[calc(100vh-var(--spacing-header)-65px)]"}>{children}</ScrollArea>
    );
};
