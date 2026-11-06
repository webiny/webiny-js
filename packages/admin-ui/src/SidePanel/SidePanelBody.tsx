import * as React from "react";
import { cn, makeDecoratable } from "~/utils.js";
import { ScrollArea } from "~/ScrollArea/index.js";

interface SidePanelBodyProps {
    /** `none` for a full-bleed list. */
    padding?: "md" | "none";
    /** Classes for the content inside the scroll area. */
    className?: string;
    /** The scrolling element, for a body that keeps its newest content in view. */
    viewportRef?: React.Ref<HTMLDivElement>;
    children: React.ReactNode;
}

/**
 * The part of a `SidePanel` that scrolls.
 *
 * `[&>div]:!block` overrides Radix's `display: table` content wrapper, which grows to fit its widest
 * child, so a wide table or a long title would otherwise widen the body past the panel.
 */
const SidePanelBodyBase = ({
    padding = "md",
    className,
    viewportRef,
    children
}: SidePanelBodyProps) => (
    <ScrollArea
        className={"min-h-0 flex-1"}
        viewportClassName={"[&>div]:!block"}
        viewportRef={viewportRef}
    >
        <div className={cn("flex flex-col", padding === "md" && "gap-md p-md", className)}>
            {children}
        </div>
    </ScrollArea>
);

const SidePanelBody = makeDecoratable("SidePanelBody", SidePanelBodyBase);

export { SidePanelBody, type SidePanelBodyProps };
