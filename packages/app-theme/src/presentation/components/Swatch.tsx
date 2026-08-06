import React from "react";
import { cn } from "@webiny/admin-ui";

interface SwatchProps {
    color: string | undefined;
    size?: "sm" | "md";
    className?: string;
}

/**
 * An inline color chip. Since preview is not shipping in v1, these swatches and the type specimen
 * are the only visual feedback anyone gets — see the design brief, section 12.
 *
 * The hairline border is always drawn: without it a white or near-white swatch is invisible against
 * the panel, which is exactly the case someone needs to see.
 */
export const Swatch = ({ color, size = "md", className }: SwatchProps) => {
    return (
        <span
            className={cn(
                "flex-none rounded-sm border border-neutral-dark/15",
                size === "sm" ? "size-3" : "size-[22px]",
                className
            )}
            style={{ background: color ?? "transparent" }}
            aria-hidden={true}
        />
    );
};
