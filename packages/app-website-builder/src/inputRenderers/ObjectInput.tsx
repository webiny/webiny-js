import React, { createContext, useContext, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Button, Label, Text } from "@webiny/admin-ui";
import { ReactComponent as AddIcon } from "@webiny/icons/add.svg";
import { ReactComponent as DeleteIcon } from "@webiny/icons/delete.svg";
import { ReactComponent as MoveUpIcon } from "@webiny/icons/keyboard_arrow_up.svg";
import { ReactComponent as MoveDownIcon } from "@webiny/icons/keyboard_arrow_down.svg";
import { ReactComponent as DragIcon } from "@webiny/icons/drag_indicator.svg";
import { ReactComponent as ObjectIcon } from "@webiny/icons/data_object.svg";
import { ReactComponent as CloseIcon } from "@webiny/icons/close.svg";

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

/**
 * Tracks how deeply nested the current object panel is. Used to compute stacking order and width -
 * a nested object opens a new panel that renders over its parent within the sidebar.
 */
const DrawerDepthContext = createContext(0);

export const useDrawerDepth = () => useContext(DrawerDepthContext);

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
                className={"absolute inset-0"}
                style={{
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
                    <div
                        className={
                            "flex items-center justify-between gap-sm px-md py-md border-b border-neutral-dimmed"
                        }
                    >
                        <div className={"flex items-center gap-sm min-w-0"}>
                            <ObjectIcon className={"w-5 h-5 shrink-0 text-primary"} />
                            <Text
                                size={"md"}
                                className={"font-semibold truncate text-neutral-primary"}
                            >
                                {title}
                            </Text>
                        </div>
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

interface ObjectRowProps {
    title: React.ReactNode;
    onOpen: () => void;
    actions?: React.ReactNode;
}

/**
 * A clickable row representing an object (a single object field, or one item of a list). Clicking
 * the row opens its drawer; trailing actions (reorder / remove) sit outside the click target.
 */
export const ObjectRow = ({ title, onOpen, actions }: ObjectRowProps) => {
    return (
        <div
            className={
                "flex items-center gap-xs rounded-md border border-neutral-dimmed bg-neutral-base hover:bg-neutral-light transition-colors"
            }
        >
            <button
                type={"button"}
                onClick={onOpen}
                className={"flex flex-1 items-center gap-sm px-sm py-xs min-w-0 text-left"}
            >
                <DragIcon className={"w-4 h-4 shrink-0 text-neutral-strong"} />
                <Text size={"sm"} className={"truncate text-neutral-primary"}>
                    {title}
                </Text>
            </button>
            {actions ? <div className={"flex items-center gap-xxs pr-xs"}>{actions}</div> : null}
        </div>
    );
};

interface ObjectRowActionsProps {
    onMoveUp: () => void;
    onMoveDown: () => void;
    onRemove: () => void;
    canMoveUp: boolean;
    canMoveDown: boolean;
}

/**
 * The trailing reorder / remove controls shown on a list item row.
 */
export const ObjectRowActions = ({
    onMoveUp,
    onMoveDown,
    onRemove,
    canMoveUp,
    canMoveDown
}: ObjectRowActionsProps) => {
    return (
        <>
            <Button
                variant={"ghost"}
                size={"sm"}
                icon={<MoveUpIcon />}
                disabled={!canMoveUp}
                onClick={onMoveUp}
            />
            <Button
                variant={"ghost"}
                size={"sm"}
                icon={<MoveDownIcon />}
                disabled={!canMoveDown}
                onClick={onMoveDown}
            />
            <Button variant={"ghost"} size={"sm"} icon={<DeleteIcon />} onClick={onRemove} />
        </>
    );
};

interface ObjectFieldHeaderProps {
    label?: React.ReactNode;
    description?: React.ReactNode;
}

export const ObjectFieldHeader = ({ label, description }: ObjectFieldHeaderProps) => {
    if (!label) {
        return null;
    }

    return <Label text={label} description={description} />;
};

interface ObjectAddButtonProps {
    text?: string;
    onClick: () => void;
}

export const ObjectAddButton = ({ text = "Add", onClick }: ObjectAddButtonProps) => {
    return (
        <div>
            <Button
                variant={"secondary"}
                size={"sm"}
                icon={<AddIcon />}
                text={text}
                onClick={onClick}
            />
        </div>
    );
};

interface ObjectEmptyStateProps {
    text?: string;
    addText?: string;
    onAdd: () => void;
}

export const ObjectEmptyState = ({
    text = "Add your first object here",
    addText = "Add",
    onAdd
}: ObjectEmptyStateProps) => {
    return (
        <div
            className={
                "flex flex-col items-center justify-center gap-sm rounded-md border border-dashed border-neutral-dimmed bg-neutral-light px-sm py-lg"
            }
        >
            <Text size={"sm"} className={"text-neutral-strong"}>
                {text}
            </Text>
            <Button
                variant={"secondary"}
                size={"sm"}
                icon={<AddIcon />}
                text={addText}
                onClick={onAdd}
            />
        </div>
    );
};
