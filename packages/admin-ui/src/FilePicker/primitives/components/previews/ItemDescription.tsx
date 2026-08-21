import React from "react";
import bytes from "bytes";
import { Text } from "~/Text/index.js";
import { Tooltip } from "~/Tooltip/index.js";
import { useIsTruncated } from "~/hooks/index.js";
import { cn } from "~/utils.js";
import type { FileItemFormatted } from "~/FilePicker/index.js";

interface TruncatedLineProps {
    children: string;
    className?: string;
}

/**
 * A single-line value that truncates when it doesn't fit, and reveals the full value in a
 * tooltip on hover. The tooltip is only attached when the value is actually cut off, so
 * fully visible values don't get a redundant tooltip.
 */
const TruncatedLine = ({ children, className }: TruncatedLineProps) => {
    const { ref, isTruncated } = useIsTruncated<HTMLSpanElement>(children);

    // The wrapper (not the inner `Text`) is what truncates and gets measured: it's a block
    // element with a known width, while the inline `Text` keeps its intrinsic width, so
    // `scrollWidth > clientWidth` tells us whether the value is cut off.
    const line = (
        <span ref={ref} className={"block truncate w-full"}>
            <Text size="sm" className={className}>
                {children}
            </Text>
        </span>
    );

    if (!isTruncated) {
        return line;
    }

    return <Tooltip trigger={line} content={children} side={"top"} />;
};

interface ItemDescriptionProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "children"> {
    item: FileItemFormatted;
    disabled?: boolean;
    small?: boolean;
}

const ItemDescription = ({ className, disabled, item, small, ...props }: ItemDescriptionProps) => {
    const formattedSize = item.size && bytes.format(item.size, { unitSeparator: " " });
    const details = [formattedSize, item.mimeType].filter(Boolean).join(" - ");

    return (
        <div className={cn("flex flex-col gap-xxs overflow-hidden min-w-0", className)} {...props}>
            <TruncatedLine className={disabled ? "text-neutral-disabled" : "text-neutral-primary"}>
                {item.name}
            </TruncatedLine>
            {!small && details && (
                <TruncatedLine
                    className={disabled ? "text-neutral-disabled" : "text-neutral-muted"}
                >
                    {details}
                </TruncatedLine>
            )}
        </div>
    );
};

export { ItemDescription, type ItemDescriptionProps };
