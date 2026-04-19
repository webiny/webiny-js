import React from "react";
import { observer } from "mobx-react-lite";
import type { IFieldVM, IFieldRendererRegistry } from "~/features/formModel/index.js";
import { isObjectFieldVM, ListItemRenderer, AddItemButton } from "./ObjectFieldComponents.js";

declare module "../../../../features/formModel/abstractions.js" {
    interface ItemTitleGenerator {
        (data: Record<string, unknown>, index: number): string;
    }

    interface IFieldRendererRegistry {
        objectListFlat: {
            fieldType: "object";
            settings?: {
                addItemLabel?: string;
                itemTitle?: string | ItemTitleGenerator;
            };
        };
    }
}

type ObjectListFlatSettings = NonNullable<IFieldRendererRegistry["objectListFlat"]["settings"]>;

export const ObjectListFlatRenderer = observer(({ field }: { field: IFieldVM }) => {
    if (!isObjectFieldVM(field) || !field.isList) {
        return null;
    }

    const settings = field.rendererSettings as ObjectListFlatSettings | undefined;

    return (
        <div className={"flex flex-col gap-sm"}>
            {field.items.map((item, index) => (
                <ListItemRenderer
                    key={item.key}
                    item={item}
                    index={index}
                    total={field.items.length}
                    label={field.label}
                    itemTitle={settings?.itemTitle}
                    disabled={field.disabled}
                />
            ))}
            <AddItemButton
                label={settings?.addItemLabel || `Add ${field.label || "Item"}`}
                disabled={field.disabled}
                onAdd={() => field.addItem()}
            />
        </div>
    );
});
