import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Button, Text } from "@webiny/admin-ui";
import { ReactComponent as CloseIcon } from "@webiny/icons/close.svg";
import { DrawerDepthContext } from "./DrawerDepthContext.js";

/**
 * Width of the first object-field panel. Slightly narrower than the editor sidebar (329px) so the
 * backdrop shows as a thin strip on its left edge.
 */
const PANEL_WIDTH = 312;

/**
 * Each nested panel is this much narrower than its parent, so the stack of open panels is visible
 * (the dimmed parent peeks out on the left).
 */
const NEST_INSET = 16;

/**
 * Duration of the enter/exit transitions. The panel stays mounted this long after closing so the
 * slide-out / fade-out can play before it unmounts.
 */
const TRANSITION_MS = 250;

/**
 * The editor sidebar carries this attribute (see `config/Sidebar/Sidebar.tsx`). Object panels are
 * portaled into it and overlay it, so they stay confined to the sidebar (no app-wide overlay).
 */
const ANCHOR_SELECTOR = "[data-role='wb-object-panel-anchor']";

/**
 * Base z-index for object panels. Each level of nesting adds 2: one slot for the panel and one for
 * its backdrop, which sits directly beneath it. Backdrops stack, so each deeper panel dims the
 * parent panel a little more.
 */
const Z_BASE = 50;

interface ObjectFieldPanelProps {
    open: boolean;
    onClose: () => void;
    title: React.ReactNode;
    depth: number;
    children: React.ReactNode;
}

/**
 * A panel holding an object's fields. It is portaled into the editor sidebar and overlays it
 * (right-aligned, slightly narrower so the backdrop shows as a thin strip on the left). A nested
 * object opens another, narrower panel over this one with its own backdrop; backdrops stack and
 * persist, so each deeper level dims its parent further. Closes on the header button, its own
 * backdrop, or Escape.
 */
export const ObjectFieldPanel = ({
    open,
    onClose,
    title,
    depth,
    children
}: ObjectFieldPanelProps) => {
    const [host] = useState<HTMLElement | null>(() =>
        typeof document !== "undefined"
            ? document.querySelector<HTMLElement>(ANCHOR_SELECTOR)
            : null
    );
    const [rendered, setRendered] = useState(open);
    const [entered, setEntered] = useState(false);

    // Mount on open; on close, play the exit transition (slide out + fade out) before unmounting.
    useEffect(() => {
        if (open) {
            setRendered(true);
            return;
        }
        setEntered(false);
        const timeout = setTimeout(() => setRendered(false), TRANSITION_MS);
        return () => clearTimeout(timeout);
    }, [open]);

    // Enter transition: once mounted and open, flip to the on-screen state after the browser paints
    // the initial off-screen / transparent state. A double rAF guarantees that first paint.
    useEffect(() => {
        if (!rendered || !open) {
            return;
        }
        let inner = 0;
        const outer = requestAnimationFrame(() => {
            inner = requestAnimationFrame(() => setEntered(true));
        });
        return () => {
            cancelAnimationFrame(outer);
            cancelAnimationFrame(inner);
        };
    }, [rendered, open]);

    useEffect(() => {
        if (!open) {
            return;
        }
        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                onClose();
            }
        };
        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, [open, onClose]);

    if (!rendered || !host) {
        return null;
    }

    const panelZIndex = Z_BASE + depth * 2;
    const panelWidth = PANEL_WIDTH - depth * NEST_INSET;

    return createPortal(
        <>
            <div
                className={"absolute top-0 bottom-0 left-0"}
                style={{
                    width: "50%",
                    backgroundColor: "rgba(25, 28, 32, 0.2)",
                    zIndex: panelZIndex - 1,
                    opacity: entered ? 1 : 0,
                    transition: "opacity 200ms ease"
                }}
                onClick={onClose}
            />
            <div
                className={"absolute top-0 bottom-0 right-0 flex shadow-lg"}
                style={{
                    width: panelWidth,
                    zIndex: panelZIndex,
                    transform: entered ? "translateX(0)" : "translateX(100%)",
                    transition: "transform 250ms ease"
                }}
            >
                <div className={"w-px h-full shrink-0 bg-neutral-dimmed"} />
                <div className={"flex flex-col flex-1 min-w-0 bg-neutral-base"}>
                    <div className={"flex items-center justify-between gap-sm px-md py-md"}>
                        <Text size={"md"} className={"font-semibold truncate text-neutral-primary"}>
                            {title}
                        </Text>
                        <Button
                            variant={"ghost"}
                            size={"sm"}
                            icon={<CloseIcon />}
                            onClick={onClose}
                        />
                    </div>
                    <div className={"flex-1 overflow-y-auto p-md"}>
                        <DrawerDepthContext.Provider value={depth + 1}>
                            <div className={"flex flex-col gap-md"}>{children}</div>
                        </DrawerDepthContext.Provider>
                    </div>
                </div>
            </div>
        </>,
        host
    );
};
