import React from "react";
import bytes from "bytes";
import { Text } from "~/Text/index.js";
import { cn } from "~/utils.js";
import type { FileItemFormatted } from "~/FilePicker/index.js";

interface ItemDescriptionProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "children"> {
    item: FileItemFormatted;
    disabled?: boolean;
    small?: boolean;
}

const ItemDescription = ({ className, disabled, item, small, ...props }: ItemDescriptionProps) => {
    const formattedSize = item.size && bytes.format(item.size, { unitSeparator: " " });

    return (
        <div
            className={cn("flex flex-col gap-xxs overflow-hidden flex-1 min-w-0", className)}
            {...props}
        >
            <Text
                size="sm"
                as="div"
                className={cn(
                    "truncate overflow-hidden whitespace-nowrap w-full",
                    disabled ? "text-neutral-disabled" : "text-neutral-primary"
                )}
            >
                {item.name}
            </Text>
            {!small && (formattedSize || item.mimeType) && (
                <Text
                    size="sm"
                    className={cn(
                        "truncate overflow-hidden whitespace-nowrap w-full",
                        disabled ? "text-neutral-disabled" : "text-neutral-muted"
                    )}
                >
                    {[formattedSize, item.mimeType].filter(Boolean).join(" - ")}
                </Text>
            )}
        </div>
    );
};

export { ItemDescription, type ItemDescriptionProps };
