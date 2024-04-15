import React from "react";
import { Skeleton } from "@webiny/ui/Skeleton";
import { Name } from "./styled";

interface TitleProps {
    title?: string;
}

export const Title = ({ title }: TitleProps) => {
    return (
        <Name use={"headline6"} tag={"h1"}>
            {title || <Skeleton theme={"dark"} />}
        </Name>
    );
};
