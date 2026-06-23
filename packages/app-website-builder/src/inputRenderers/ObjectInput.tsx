import React, {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useLayoutEffect,
    useState
} from "react";
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
 * Width of a single object-field panel. Slightly narrower than the editor sidebar (329px) so it
 * reads as an overlay sitting on top of it. Nested panels are offset left by this amount so they
 * cascade beside their parent instead of fully covering it.
 */
const PANEL_WIDTH = 312;

/**
 * The editor sidebar carries this attribute (see `config/Sidebar/Sidebar.tsx`). It is measured so
 * object panels can be positioned directly over it (right-aligned, below the top bars).
 */
const ANCHOR_SELECTOR = "[data-role='wb-object-panel-anchor']";

/**
 * Base z-index for object panels. Each level of nesting adds 2 (one slot for the panel, one for
 * its backdrop, which sits directly beneath the topmost panel).
 */
const Z_BASE = 50;

/**
 * Tracks how deeply nested the current object panel is. Each panel offsets itself by
 * `depth * PANEL_WIDTH` so a nested object opens a new panel beside its parent rather than on top
 * of it.
 */
const DrawerDepthContext = createContext(0);

export const useDrawerDepth = () => useContext(DrawerDepthContext);

interface PanelStack {
    register: (depth: number) => void;
    unregister: (depth: number) => void;
    topDepth: number;
}

const PanelStackContext = createContext<PanelStack>({
    register: () => undefined,
    unregister: () => undefined,
    topDepth: -1
});

/**
 * Tracks which object panels are currently open so that only the deepest (topmost) one renders the
 * backdrop. Everything beneath the topmost panel - parent panels, the sidebar and the canvas - is
 * dimmed by that single scrim. Mount once above the element inputs.
 */
export const ObjectPanelStackProvider = ({ children }: { children: React.ReactNode }) => {
    const [openDepths, setOpenDepths] = useState<number[]>([]);

    const register = useCallback((depth: number) => {
        setOpenDepths(prev => (prev.includes(depth) ? prev : [...prev, depth]));
    }, []);

    const unregister = useCallback((depth: number) => {
        setOpenDepths(prev => prev.filter(value => value !== depth));
    }, []);

    const topDepth = openDepths.length > 0 ? Math.max(...openDepths) : -1;

    return (
        <PanelStackContext.Provider value={{ register, unregister, topDepth }}>
            {children}
        </PanelStackContext.Provider>
    );
};

interface ObjectFieldPanelProps {
    open: boolean;
    onClose: () => void;
    title: React.ReactNode;
    depth: number;
    children: React.ReactNode;
}

/**
 * A panel holding an object's fields. It is rendered over the editor sidebar (right-aligned, below
 * the top bars), with a backdrop covering the editor area to its left. Nested objects open another
 * panel cascading to the left, and the topmost panel's backdrop dims every parent panel + the
 * sidebar + the canvas behind it. Closes on the header button, the backdrop, or the Escape key.
 */
export const ObjectFieldPanel = ({
    open,
    onClose,
    title,
    depth,
    children
}: ObjectFieldPanelProps) => {
    const { register, unregister, topDepth } = useContext(PanelStackContext);
    const [anchorRect, setAnchorRect] = useState<DOMRect | null>(null);

    // Measure the sidebar so the panel can be positioned directly over it and the backdrop can
    // span the editor area below the top bars.
    useLayoutEffect(() => {
        if (!open) {
            return;
        }
        const anchor = document.querySelector<HTMLElement>(ANCHOR_SELECTOR);
        if (!anchor) {
            return;
        }
        const measure = () => setAnchorRect(anchor.getBoundingClientRect());
        measure();
        window.addEventListener("resize", measure);
        return () => window.removeEventListener("resize", measure);
    }, [open]);

    useEffect(() => {
        if (!open) {
            return;
        }
        register(depth);
        return () => unregister(depth);
    }, [open, depth, register, unregister]);

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

    if (!open || !anchorRect) {
        return null;
    }

    const panelZIndex = Z_BASE + depth * 2;
    // Only the deepest open panel paints the scrim; it sits one z-level below this panel, dimming
    // every parent panel, the sidebar and the canvas behind it.
    const isTopmost = depth === topDepth;
    // Anchor over the sidebar's right edge; nested panels cascade one panel-width to the left.
    const rightOffset = window.innerWidth - anchorRect.right + depth * PANEL_WIDTH;

    return createPortal(
        <>
            {isTopmost ? (
                <div
                    className={"fixed"}
                    style={{
                        top: anchorRect.top,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: "rgba(25, 28, 32, 0.2)",
                        zIndex: panelZIndex - 1
                    }}
                    onClick={onClose}
                />
            ) : null}
            <div
                className={"fixed flex shadow-lg"}
                style={{
                    top: anchorRect.top,
                    height: anchorRect.height,
                    right: rightOffset,
                    width: PANEL_WIDTH,
                    zIndex: panelZIndex
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
        document.body
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
