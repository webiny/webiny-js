import * as React from "react";
import { cn } from "~/utils.js";
import { makeDecoratable } from "~/utils.js";

interface SidePanelFooterProps extends React.HTMLAttributes<HTMLDivElement> {
    /** `light` is the 12px key-hint bar on a subtle fill. */
    variant?: "default" | "light";
}

/** The pinned bottom of a `SidePanel`: a composer, or a line of key hints. */
const SidePanelFooterBase = ({
    variant = "default",
    className,
    ...props
}: SidePanelFooterProps) => (
    <div
        className={cn(
            "flex flex-none flex-col border-t-sm border-neutral-dimmed",
            variant === "default" && "gap-sm p-md",
            variant === "light" &&
                "bg-neutral-subtle px-md py-sm-extra text-sm text-neutral-strong",
            className
        )}
        {...props}
    />
);

const SidePanelFooter = makeDecoratable("SidePanelFooter", SidePanelFooterBase);

export { SidePanelFooter, type SidePanelFooterProps };
