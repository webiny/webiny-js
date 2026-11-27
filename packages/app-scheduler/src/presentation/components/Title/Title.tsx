import React from "react";
import { Heading } from "@webiny/admin-ui";
import { Skeleton } from "@webiny/admin-ui";

export interface TitleProps {
    title?: string;
}

export const Title = ({ title }: TitleProps) => {
    return (
        <Heading
            level={6}
            as={"h1"}
            className={"pl-sm leading-[48px] whitespace-nowrap overflow-hidden text-ellipsis"}
        >
            {title || <Skeleton />}
        </Heading>
    );
};
