import React from "react";
import { observer } from "mobx-react-lite";
import { Accordion } from "@webiny/admin-ui";
import type {
    IFieldVM,
    IObjectFieldVM,
    IFieldRendererRegistry
} from "~/features/formModel/index.js";
import { isObjectFieldVM, ListItemRenderer, AddItemButton } from "./ObjectFieldComponents.js";

declare module "../../../../features/formModel/abstractions.js" {
    interface IFieldRendererRegistry {
        objectAccordionMultiple: {
            fieldType: "object";
            settings?: {
                open?: boolean;
                itemTitle?: string | ((data: Record<string, unknown>, index: number) => string);
                addValueButtonLabel?: string;
            };
        };
    }
}

type Settings = NonNullable<IFieldRendererRegistry["objectAccordionMultiple"]["settings"]>;

export const ObjectAccordionMultipleRenderer = observer(({ field }: { field: IFieldVM }) => {
    if (!isObjectFieldVM(field) || !field.isList) {
        return null;
    }

    return <ListObjectRenderer field={field} />;
});

const ListObjectRenderer = observer(({ field }: { field: IObjectFieldVM }) => {
    const label = `${field.label || ""} ${field.items.length ? `(${field.items.length})` : ""}`;
    const settings = field.rendererSettings as Settings | undefined;

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
                label={settings?.addValueButtonLabel ?? `Add ${field.label || "Item"}`}
                disabled={field.disabled}
                onAdd={() => field.addItem()}
            />
        </div>
    );
});
