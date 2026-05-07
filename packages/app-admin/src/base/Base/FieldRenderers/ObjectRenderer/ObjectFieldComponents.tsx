import React, { useEffect, useState } from "react";
import { observer } from "mobx-react-lite";
import { Accordion, Button, IconButton } from "@webiny/admin-ui";
import { ReactComponent as DeleteIcon } from "@webiny/icons/delete_outline.svg";
import { ReactComponent as ArrowUp } from "@webiny/icons/arrow_upward.svg";
import { ReactComponent as ArrowDown } from "@webiny/icons/arrow_downward.svg";
import type {
    IFieldVM,
    IObjectFieldVM,
    IObjectFieldItemVM,
    LayoutNodeVM
} from "~/features/formModel/index.js";
import { LayoutNodeRenderer } from "~/features/formModel/FormView.js";
import { resolveItemTitle } from "./resolveItemTitle.js";
/**
 * Walks a resolved layout sub-tree. Used by dynamic-zone renderers to render
 * a templated object's children via per-template layouts (Phase 8c).
 */
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
    disabled: boolean;
}

export const ListItemRenderer = observer(
    ({ item, index, total, label, itemTitle, disabled }: ListItemRendererProps) => {
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

        return (
            <Accordion
                background={"base"}
                variant={"container"}
                openClosedIndicatorPosition={"left"}
            >
                <Accordion.Item
                    title={resolveItemTitle(item, index, label, itemTitle)}
                    actions={disabled ? null : actions}
                    open={open}
                    onOpenChange={setOpen}
                >
                    <NestedLayout layout={item.layout} />
                </Accordion.Item>
            </Accordion>
        );
    }
);

export interface AddItemButtonProps {
    label?: string;
    disabled: boolean;
    onAdd: () => void;
}

export const AddItemButton = ({ label, disabled, onAdd }: AddItemButtonProps) => {
    return (
        <div>
            <Button
                text={label || "Add Item"}
                variant={"secondary"}
                size={"sm"}
                onClick={onAdd}
                disabled={disabled}
            />
        </div>
    );
};
