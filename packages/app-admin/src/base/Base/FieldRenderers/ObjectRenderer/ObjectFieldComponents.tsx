import React from "react";
import { observer } from "mobx-react-lite";
import { Accordion, Button, IconButton } from "@webiny/admin-ui";
import { ReactComponent as DeleteIcon } from "@webiny/icons/delete_outline.svg";
import { ReactComponent as ArrowUp } from "@webiny/icons/arrow_upward.svg";
import { ReactComponent as ArrowDown } from "@webiny/icons/arrow_downward.svg";
import type { IFieldVM, IObjectFieldVM, IObjectFieldItemVM } from "~/features/formModel/index.js";
import { useFormViewRenderers } from "~/features/formModel/FormView.js";
import { resolveItemTitle } from "./resolveItemTitle.js";

export const isObjectFieldVM = (field: IFieldVM): field is IObjectFieldVM => {
    return field.type === "object";
};

export const ChildFields = observer(({ fields }: { fields: IFieldVM[] }) => {
    const { fieldRenderers } = useFormViewRenderers();

    return (
        <div className={"flex flex-col gap-4 p-sm"}>
            {fields.map(childField => {
                const Renderer = childField.renderer
                    ? fieldRenderers[childField.renderer]
                    : undefined;

                if (!Renderer) {
                    return null;
                }

                return <Renderer key={childField.name} field={childField} />;
            })}
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
                    defaultOpen={false}
                >
                    <ChildFields fields={item.fields} />
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
