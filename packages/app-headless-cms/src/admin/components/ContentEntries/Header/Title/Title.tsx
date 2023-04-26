import React from "react";
import { Skeleton } from "@webiny/ui/Skeleton";
import { Name } from "./styled";

interface Props {
    title?: string;
}

export const Title: React.VFC<Props> = ({ title }) => {
    return (
        <Name use={"headline6"} tag={"h1"}>
            {title || <Skeleton theme={"dark"} />}
        </Name>
    );
};
