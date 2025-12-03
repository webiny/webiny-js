import React from "react";
import { cn, Text } from "@webiny/admin-ui";

interface DescriptionProps {
    description?: string | null;
}

export const Description = ({ description }: DescriptionProps) => {
    const MAX_LENGTH = 320;
    if (!description) {
        return null;
    }

    return (
        <Text size="sm" as="div" className={cn("truncate w-full text-neutral-muted")}>
            {description.length > MAX_LENGTH
                ? description.substring(0, MAX_LENGTH) + "..."
                : description}
        </Text>
    );
};
