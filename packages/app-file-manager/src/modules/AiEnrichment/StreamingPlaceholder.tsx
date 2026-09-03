import React from "react";
import { cn, Skeleton } from "@webiny/admin-ui";

// Uneven on purpose: equal-length bars read as a table, not as content still arriving.
const WIDTHS: Record<StreamingPlaceholderVariant, string[]> = {
    chips: ["w-16", "w-24", "w-20", "w-14"],
    text: ["w-full", "w-full", "w-3/4"]
};

export type StreamingPlaceholderVariant = "chips" | "text";

export interface StreamingPlaceholderProps {
    /** While the producer is still running, an empty field is pending — not empty. */
    loading: boolean;
    variant: StreamingPlaceholderVariant;
}

/**
 * Stands in for a field that has no content yet: skeleton bars while a stream is running, and a dash
 * once it has stopped and the field genuinely came back empty.
 *
 * The bar widths and layout live here rather than in props, so a caller says what KIND of content is
 * coming and nothing more.
 */
export const StreamingPlaceholder = ({ loading, variant }: StreamingPlaceholderProps) => {
    if (!loading) {
        return <div className={"text-sm text-neutral-strong"}>{"—"}</div>;
    }

    const chips = variant === "chips";

    return (
        <div className={chips ? "flex flex-wrap gap-xs" : "flex flex-col gap-xs"}>
            {WIDTHS[variant].map(width => (
                <Skeleton
                    key={width}
                    type={"text"}
                    size={"sm"}
                    className={cn(width, chips && "rounded")}
                />
            ))}
        </div>
    );
};
