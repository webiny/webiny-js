import React from "react";
import { Skeleton, Heading } from "@webiny/admin-ui";

export interface TitleProps {
    title?: string;
}

export const Title = ({ title }: TitleProps) => {
    return title ? (
        <Heading level={5} className={"text-neutral-primary"}>
            {title}
        </Heading>
    ) : (
        <Skeleton size={"md"} />
    );
};
