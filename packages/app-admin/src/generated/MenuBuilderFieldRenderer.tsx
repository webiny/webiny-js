import React from "react";
import { observer } from "mobx-react-lite";
import {
    Button,
    FormComponentDescription,
    FormComponentLabel,
    Input,
    Tree,
    type DropOptions,
    type NodeDto
} from "@webiny/admin-ui";
import { createObjectFieldRenderer } from "~/features/formModel/createFieldRenderer.js";
import type { IFieldVM, IObjectFieldItemVM } from "~/features/formModel/abstractions.js";

declare module "~/features/formModel/abstractions.js" {
    interface IFieldRendererRegistry {
        menuBuilder: {
            fieldType: "object";
            settings?: {
                addItemLabel?: string;
            };
        };
    }
}

const ROOT_ID = "menu-builder-root";

interface MenuItemNodeData {
    item: IObjectFieldItemVM;
}

function getChildField(item: IObjectFieldItemVM, name: string): IFieldVM | undefined {
    return item.fields.find(childField => childField.name === name);
}

export const MenuBuilderFieldRenderer = createObjectFieldRenderer<"menuBuilder">(({ field }) => {
    if (!field.isList) {
        return null;
    }

    const settings = field.rendererSettings;

    const nodes: NodeDto<MenuItemNodeData>[] = field.items.map(item => {
        const labelField = getChildField(item, "label");
        const label =
            typeof labelField?.value === "string" && labelField.value.length > 0
                ? labelField.value
                : "Untitled menu item";

        return {
            id: item.key,
            label,
            parentId: ROOT_ID,
            droppable: false,
            data: { item }
        };
    });

    const handleDrop = (
        newTree: NodeDto<MenuItemNodeData>[],
        options: DropOptions<MenuItemNodeData>
    ) => {
        const { dragSourceId } = options;
        if (!dragSourceId) {
            return;
        }

        const fromIndex = field.items.findIndex(item => item.key === dragSourceId);
        const newOrder = newTree.filter(node => node.parentId === ROOT_ID).map(node => node.id);
        const toIndex = newOrder.indexOf(dragSourceId);

        if (fromIndex === -1 || toIndex === -1 || fromIndex === toIndex) {
            return;
        }

        field.moveItem(fromIndex, toIndex);
    };

    return (
        <div className={"flex flex-col gap-md"}>
            {field.label && <FormComponentLabel text={field.label} hint={field.help} />}
            {field.description && <FormComponentDescription text={field.description} />}

            {nodes.length > 0 && (
                <Tree<MenuItemNodeData>
                    rootId={ROOT_ID}
                    nodes={nodes}
                    canDrag={() => !field.disabled}
                    canDrop={(_, options) => options.dropTargetId === ROOT_ID}
                    onDrop={handleDrop}
                    renderer={node => <MenuItemRow item={node.item} disabled={field.disabled} />}
                />
            )}

            {!field.disabled && (
                <div>
                    <Button
                        text={settings?.addItemLabel ?? "Add menu item"}
                        variant={"secondary"}
                        size={"sm"}
                        onClick={() => field.addItem()}
                    />
                </div>
            )}
        </div>
    );
});

interface MenuItemRowProps {
    item: IObjectFieldItemVM;
    disabled: boolean;
}

const MenuItemRow = observer(({ item, disabled }: MenuItemRowProps) => {
    const labelField = getChildField(item, "label");
    const urlField = getChildField(item, "url");

    return (
        <div className={"flex items-center gap-sm w-full"}>
            <div className={"flex-1"}>
                <Input
                    placeholder={"Label"}
                    value={typeof labelField?.value === "string" ? labelField.value : ""}
                    onChange={value => labelField?.onChange(value)}
                    disabled={disabled}
                />
            </div>
            <div className={"flex-1"}>
                <Input
                    placeholder={"URL"}
                    value={typeof urlField?.value === "string" ? urlField.value : ""}
                    onChange={value => urlField?.onChange(value)}
                    disabled={disabled}
                />
            </div>
            {!disabled && (
                <Button
                    text={"Remove"}
                    variant={"ghost"}
                    size={"sm"}
                    onClick={() => item.remove()}
                />
            )}
        </div>
    );
});
