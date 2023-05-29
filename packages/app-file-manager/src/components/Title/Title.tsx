import React from "react";

import { Skeleton } from "@webiny/ui/Skeleton";

import { Name } from "./styled";

export interface TitleProps {
    title?: string;
}

export const Title: React.FC<TitleProps> = ({ title }) => {
    return (
        <Name use={"headline6"} tag={"h1"}>
            {title || <Skeleton theme={"dark"} />}
        </Name>
    );
};
