import React from "react";
import { Accordion } from "@webiny/admin-ui";
import { createObjectFieldRenderer } from "~/features/formModel/createFieldRenderer.js";
import { ListItemRenderer, AddItemButton } from "./ObjectFieldComponents.js";

declare module "../../../../features/formModel/abstractions.js" {
    interface IFieldRendererRegistry {
        objectAccordionMultiple: {
            fieldType: "object";
            settings?: {
                open?: boolean;
                container?: boolean;
                itemTitle?: string | ((data: Record<string, unknown>, index: number) => string);
                addItemLabel?: string;
            };
        };
    }
}

export const ObjectAccordionMultipleRenderer = createObjectFieldRenderer<"objectAccordionMultiple">(
    ({ field }) => {
        if (!field.isList) {
            return null;
        }

        const settings = field.rendererSettings;
        const showContainer = settings?.container !== false;

        const addButton = (
            <AddItemButton
                label={settings?.addItemLabel ?? `Add ${field.label || "Item"}`}
                disabled={field.disabled}
                onAdd={() => field.addItem()}
            />
        );

        if (!showContainer) {
            return (
                <div className={"flex flex-col gap-lg"}>
                    <ListItems field={field} />
                    {addButton}
                </div>
            );
        }

        const label = `${field.label || ""} ${field.items.length ? `(${field.items.length})` : ""}`;

        return (
            <div className={"flex flex-col gap-lg"}>
                <Accordion background={"base"} variant={"container"}>
                    <Accordion.Item title={label} defaultOpen={true}>
                        <ListItems field={field} />
                    </Accordion.Item>
                </Accordion>
                {addButton}
            </div>
        );
    }
);

const ListItems = createObjectFieldRenderer<"objectAccordionMultiple">(({ field }) => {
    const settings = field.rendererSettings;

    return (
        <div className={"flex flex-col gap-md"}>
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
    );
});
