import React from "react";
import { Skeleton } from "@webiny/admin-ui";
import { Name } from "./Title.styled.js";

export interface TitleProps {
    title?: string;
}

export const Title = ({ title }: TitleProps) => {
    return (
        <Name level={6} as={"h1"}>
            {title || <Skeleton />}
        </Name>
    );
};
