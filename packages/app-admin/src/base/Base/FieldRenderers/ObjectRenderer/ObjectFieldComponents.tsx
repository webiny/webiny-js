import React, { useEffect, useState } from "react";
import { observer } from "mobx-react-lite";
import { Accordion, Button, IconButton } from "@webiny/admin-ui";
import { ReactComponent as AddIcon } from "@webiny/icons/add.svg";
import { ReactComponent as DeleteIcon } from "@webiny/icons/delete_outline.svg";
import { ReactComponent as ArrowUp } from "@webiny/icons/arrow_upward.svg";
import { ReactComponent as ArrowDown } from "@webiny/icons/arrow_downward.svg";
import type { IObjectFieldItemVM, LayoutNodeVM } from "~/features/formModel/index.js";
import { LayoutNodeRenderer } from "~/features/formModel/FormView.js";
import { resolveItemTitle, resolveItemDescription } from "./resolveItemTitle.js";
import type { ISortableItemProps } from "~/presentation/sortable/index.js";

export const NestedLayout = observer(({ layout }: { layout: LayoutNodeVM[] }) => {
    return (
        <div className={"flex flex-col gap-md"}>
            {layout.map((node, index) => (
                <LayoutNodeRenderer key={index} node={node} />
            ))}
        </div>
    );
});

export interface ListItemRendererProps {
    item: IObjectFieldItemVM;
    index: number;
    total: number;
    label?: string;
    itemTitle?: string | ((data: Record<string, unknown>, index: number) => string);
    itemDescription?: string | ((data: Record<string, unknown>, index: number) => string);
    disabled: boolean;
    sortable?: ISortableItemProps;
}

export const ListItemRenderer = observer(
    ({
        item,
        index,
        total,
        label,
        itemTitle,
        itemDescription,
        disabled,
        sortable
    }: ListItemRendererProps) => {
        const [open, setOpen] = useState(false);
        const hasFocusRequest = item.fields.some(f => f.focusRequested);

        useEffect(() => {
            if (hasFocusRequest) {
                setOpen(true);
            }
        }, [hasFocusRequest]);

        const actions = (
            <>
                <IconButton
                    icon={<ArrowDown />}
                    onClick={e => {
                        e.stopPropagation();
                        item.moveDown();
                    }}
                    variant="ghost"
                    disabled={index === total - 1}
                />
                <IconButton
                    icon={<ArrowUp />}
                    onClick={e => {
                        e.stopPropagation();
                        item.moveUp();
                    }}
                    variant="ghost"
                    disabled={index === 0}
                />
                <Accordion.Item.Action.Separator />
                <IconButton
                    icon={<DeleteIcon />}
                    onClick={e => {
                        e.stopPropagation();
                        item.remove();
                    }}
                    variant="ghost"
                />
            </>
        );

        const accordion = (
            <Accordion
                background={"base"}
                variant={"container"}
                openClosedIndicatorPosition={"left"}
            >
                <Accordion.Item
                    title={resolveItemTitle(item, index, label, itemTitle)}
                    description={resolveItemDescription(item, index, itemDescription)}
                    actions={disabled ? null : actions}
                    open={open}
                    onOpenChange={setOpen}
                    draggable={!disabled && sortable !== undefined}
                    dragHandleRef={sortable?.handleRef}
                >
                    <NestedLayout layout={item.layout} />
                </Accordion.Item>
            </Accordion>
        );

        if (!sortable) {
            return accordion;
        }

        return (
            <div
                ref={sortable.ref}
                data-sortable-item=""
                className={"relative"}
                style={{ opacity: sortable.isDragging ? 0.4 : 1 }}
            >
                {sortable.closestEdge === "top" && (
                    <DropIndicator position={"top"} isFirst={index === 0} />
                )}
                {accordion}
                {sortable.closestEdge === "bottom" && (
                    <DropIndicator position={"bottom"} isLast={index === total - 1} />
                )}
            </div>
        );
    }
);

const DropIndicator = ({
    position,
    isFirst = false,
    isLast = false
}: {
    position: "top" | "bottom";
    isFirst?: boolean;
    isLast?: boolean;
}) => {
    let offset = "calc(var(--spacing-md) / -2)";
    if (position === "top" && isFirst) {
        offset = "0px";
    }
    if (position === "bottom" && isLast) {
        offset = "0px";
    }

    return (
        <div
            className={"absolute left-0 right-0 z-10"}
            style={{
                [position]: offset,
                transform: position === "top" ? "translateY(-50%)" : "translateY(50%)"
            }}
        >
            <div className={"w-full h-[2px] bg-primary rounded-full"} />
        </div>
    );
};

export interface AddItemButtonProps {
    label?: string;
    disabled: boolean;
    onAdd: () => void;
}

export const AddItemButton = ({ label, disabled, onAdd }: AddItemButtonProps) => {
    return (
        <div>
            <Button
                icon={<AddIcon />}
                text={label || "Add Item"}
                variant={"tertiary"}
                onClick={onAdd}
                disabled={disabled}
            />
        </div>
    );
};
