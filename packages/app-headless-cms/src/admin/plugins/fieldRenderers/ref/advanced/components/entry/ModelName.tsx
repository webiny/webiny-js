import React from "react";
import { cn, Text } from "@webiny/admin-ui";

interface ModelNameProps {
    name: string;
}

export const ModelName = ({ name }: ModelNameProps) => {
    return (
        <Text size="sm" as="div" className={cn("truncate w-full text-neutral-muted")}>
            {name}
        </Text>
    );
};
