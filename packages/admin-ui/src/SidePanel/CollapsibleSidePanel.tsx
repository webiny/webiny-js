import * as React from "react";
import { cn } from "~/utils.js";
import { makeDecoratable } from "~/utils.js";
import { SidePanelRail } from "./SidePanelRail.js";

/** `SidePanelRail`'s width. */
const COLLAPSED_WIDTH = 45;

interface CollapsibleSidePanelProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "children"> {
    open: boolean;
    /** The panel's name, written down the rail while it is collapsed. Short: one or two words. */
    label: string;
    /** The side of the page the panel is docked on. Default `"left"`. */
    side?: "left" | "right";
    onExpand: () => void;
    /**
     * The open width in pixels. Left out, the panel takes the content's own width, so the content
     * has to size itself (`w-max`, or a width of its own).
     */
    width?: number;
    /**
     * Draws the border on the page side, around the open panel and the rail alike. Leave it off when
     * the content draws its own; the rail then draws one while collapsed.
     */
    bordered?: boolean;
    /** The open panel. Put a `CollapsibleSidePanelHeader` in it for the collapse button. */
    children: React.ReactNode;
}

/**
 * A side panel that collapses to a `SidePanelRail`. The width slides between the open width and the
 * rail's, and the content and the rail cross-fade. The content stays mounted while collapsed, so it
 * keeps its state (a chat, a scroll position); `inert` keeps it out of the tab order and away from
 * the pointer.
 *
 * When `open` changes, focus moves to the button that replaced the one pressed: the rail's open
 * button after collapsing, and the header's collapse button (or the content's first button) after
 * opening.
 */
const CollapsibleSidePanelBase = ({
    open,
    label,
    side = "left",
    onExpand,
    width,
    bordered = false,
    className,
    style,
    children,
    ...props
}: CollapsibleSidePanelProps) => {
    const panelRef = React.useRef<HTMLDivElement>(null);
    const contentRef = React.useRef<HTMLDivElement>(null);
    const [contentWidth, setContentWidth] = React.useState<number | null>(null);
    const mounted = React.useRef(false);

    // Without a set width, the panel animates to whatever width the content takes.
    React.useLayoutEffect(() => {
        const content = contentRef.current;
        if (width !== undefined || !content) {
            return;
        }
        const measure = () => setContentWidth(content.offsetWidth);
        measure();
        const observer = new ResizeObserver(measure);
        observer.observe(content);
        return () => observer.disconnect();
    }, [width]);

    React.useEffect(() => {
        if (!mounted.current) {
            mounted.current = true;
            return;
        }
        const panel = panelRef.current;
        if (!open) {
            panel?.querySelector<HTMLElement>('[data-role="side-panel-rail-expand"]')?.focus();
            return;
        }
        const collapse = panel?.querySelector<HTMLElement>(
            '[data-role="collapsible-side-panel-collapse"]'
        );
        const first = contentRef.current?.querySelector<HTMLElement>("button:not([disabled])");
        (collapse ?? first)?.focus();
    }, [open]);

    let panelWidth: number | undefined = COLLAPSED_WIDTH;
    if (open) {
        // Unmeasured on the first render: the content's own width, without an animation.
        panelWidth = width ?? contentWidth ?? undefined;
    }

    return (
        <div
            ref={panelRef}
            data-role={"collapsible-side-panel"}
            className={cn(
                "relative flex-none overflow-hidden transition-[width] duration-200 ease-in-out",
                bordered && side === "left" && "border-r-sm border-r-neutral-dimmed",
                bordered && side === "right" && "border-l-sm border-l-neutral-dimmed",
                className
            )}
            style={{ width: panelWidth, ...style }}
            {...props}
        >
            <div
                ref={contentRef}
                inert={!open}
                className={cn(
                    "absolute inset-y-0 transition-opacity duration-150",
                    width === undefined && "w-max",
                    // Pinned to the page's edge, so the panel closes from the inner side.
                    side === "left" ? "left-0" : "right-0",
                    open ? "opacity-100 delay-75" : "pointer-events-none opacity-0"
                )}
                style={{ width }}
            >
                {children}
            </div>
            <div
                inert={open}
                className={cn(
                    "absolute inset-0 flex transition-opacity duration-150",
                    side === "left" ? "justify-start" : "justify-end",
                    open ? "pointer-events-none opacity-0" : "opacity-100 delay-75"
                )}
            >
                <SidePanelRail label={label} side={side} bordered={!bordered} onExpand={onExpand} />
            </div>
        </div>
    );
};

const CollapsibleSidePanel = makeDecoratable("CollapsibleSidePanel", CollapsibleSidePanelBase);

export { CollapsibleSidePanel, type CollapsibleSidePanelProps };
