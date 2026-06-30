import React from "react";
import { Heading } from "@webiny/admin-ui";

interface Props {
    name: string;
}

export const VariantTitle = ({ name }: Props) => {
    return <Heading level={6}>{`Variant: ${name}`}</Heading>;
};
