import React, { ReactElement } from "react";
import { Name } from "~/admin/components/Table/Header/Title/styled";
import { Skeleton } from "@webiny/ui/Skeleton";

interface Props {
    title?: string;
}

export const Title = ({ title }: Props): ReactElement => {
    return (
        <Name use={"headline6"} tag={"h1"}>
            {title || <Skeleton />}
        </Name>
    );
};
