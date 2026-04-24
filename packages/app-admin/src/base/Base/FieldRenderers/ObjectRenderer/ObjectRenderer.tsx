import React from "react";
import { observer } from "mobx-react-lite";
import { Accordion } from "@webiny/admin-ui";
import type {
    IFieldVM,
    IObjectFieldVM,
    IFieldRendererRegistry
} from "~/features/formModel/index.js";
import {
    isObjectFieldVM,
    ChildFields,
    ListItemRenderer,
    AddItemButton
} from "./ObjectFieldComponents.js";
import { DynamicZoneRenderer } from "./DynamicZoneRenderer.js";

declare module "../../../../features/formModel/abstractions.js" {
    interface IFieldRendererRegistry {
        object: {
            fieldType: "object";
            settings?: {
                itemTitle?: string | ((data: Record<string, unknown>, index: number) => string);
            };
        };
    }
}

type ObjectSettings = NonNullable<IFieldRendererRegistry["object"]["settings"]>;

export const ObjectRenderer = observer(({ field }: { field: IFieldVM }) => {
    if (!isObjectFieldVM(field)) {
        return null;
    }

    if (field.isList) {
        return <ListObjectRenderer field={field} />;
    }

    if (field.isTemplated) {
        return <DynamicZoneRenderer field={field} />;
    }

    return <SingleObjectRenderer field={field} />;
});

const SingleObjectRenderer = observer(({ field }: { field: IObjectFieldVM }) => {
    return (
        <Accordion background={"base"} variant={"container"}>
            <Accordion.Item title={field.label} defaultOpen={true}>
                <ChildFields fields={field.fields} />
            </Accordion.Item>
        </Accordion>
    );
});

const ListObjectRenderer = observer(({ field }: { field: IObjectFieldVM }) => {
    const label = `${field.label || ""} ${field.items.length ? `(${field.items.length})` : ""}`;
    const settings = field.rendererSettings as ObjectSettings | undefined;

    return (
        <div className={"flex flex-col gap-sm"}>
            <Accordion background={"base"} variant={"container"}>
                <Accordion.Item title={label} defaultOpen={true}>
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
                    </div>
                </Accordion.Item>
            </Accordion>
            <AddItemButton
                label={`Add ${field.label || "Item"}`}
                disabled={field.disabled}
                onAdd={() => field.addItem()}
            />
        </div>
    );
});
