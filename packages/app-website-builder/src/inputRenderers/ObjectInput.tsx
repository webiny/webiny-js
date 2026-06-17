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
 * Width of a single object-field panel. Nested panels are offset by this amount so they cascade
 * next to each other instead of overlapping.
 */
const PANEL_WIDTH = 320;

/**
 * The editor sidebar carries this attribute (see `config/Sidebar/Sidebar.tsx`) and is the
 * positioning anchor for object panels: they are portaled into it and positioned just to its left.
 */
const ANCHOR_SELECTOR = "[data-role='wb-object-panel-anchor']";

/**
 * Tracks how deeply nested the current object panel is. Each panel offsets itself by
 * `depth * PANEL_WIDTH` (measured from the sidebar's left edge) so a nested object opens a new
 * panel beside its parent rather than on top of it.
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
 * A panel holding an object's fields. It is portaled into the editor sidebar and positioned
 * immediately to its left (cascading further left for nested objects), leaving the canvas and
 * sidebar visible and interactive. Closes on the header button or the Escape key.
 */
export const ObjectFieldPanel = ({
    open,
    onClose,
    title,
    depth,
    children
}: ObjectFieldPanelProps) => {
    const [host, setHost] = useState<HTMLElement | null>(null);

    useEffect(() => {
        setHost(document.querySelector<HTMLElement>(ANCHOR_SELECTOR));
    }, []);

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

    if (!open || !host) {
        return null;
    }

    return createPortal(
        <div
            className={"absolute top-0 h-full flex shadow-lg"}
            style={{
                right: `calc(100% + ${depth * PANEL_WIDTH}px)`,
                width: PANEL_WIDTH,
                zIndex: 50 + depth
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
                        <Text size={"md"} className={"font-semibold truncate text-neutral-primary"}>
                            {title}
                        </Text>
                    </div>
                    <Button variant={"ghost"} size={"sm"} icon={<CloseIcon />} onClick={onClose} />
                </div>
                <div className={"flex-1 overflow-y-auto p-md"}>
                    <DrawerDepthContext.Provider value={depth + 1}>
                        <div className={"flex flex-col gap-md"}>{children}</div>
                    </DrawerDepthContext.Provider>
                </div>
            </div>
        </div>,
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
