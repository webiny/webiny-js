import React from "react";
import { Text } from "@webiny/admin-ui";

type EmptyProps = {
    disclaimer?: string;
};

export const Empty = ({ disclaimer = `No tags found...` }: EmptyProps) => {
    return <Text className={"text-neutral-muted"}>{disclaimer}</Text>;
};
