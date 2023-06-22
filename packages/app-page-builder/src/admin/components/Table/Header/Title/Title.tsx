import React, { ReactElement } from "react";

import { Skeleton } from "@webiny/ui/Skeleton";

import { Name } from "./styled";

export interface TitleProps {
    title?: string;
}

export const Title = ({ title }: TitleProps): ReactElement => {
    return (
        <Name use={"headline6"} tag={"h1"}>
            {title !== undefined ? title : <Skeleton theme={"dark"} />}
        </Name>
    );
};
