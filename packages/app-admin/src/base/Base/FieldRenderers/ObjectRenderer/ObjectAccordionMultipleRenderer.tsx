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
                container?: boolean;
                itemTitle?: string | ((data: Record<string, unknown>, index: number) => string);
                addItemLabel?: string;
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

const ListItems = observer(
    ({ field, settings }: { field: IObjectFieldVM; settings: Settings | undefined }) => {
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
    }
);

const ListObjectRenderer = observer(({ field }: { field: IObjectFieldVM }) => {
    const settings = field.rendererSettings as Settings | undefined;
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
                <ListItems field={field} settings={settings} />
                {addButton}
            </div>
        );
    }

    const label = `${field.label || ""} ${field.items.length ? `(${field.items.length})` : ""}`;

    return (
        <div className={"flex flex-col gap-lg"}>
            <Accordion background={"base"} variant={"container"}>
                <Accordion.Item title={label} defaultOpen={true}>
                    <ListItems field={field} settings={settings} />
                </Accordion.Item>
            </Accordion>
            {addButton}
        </div>
    );
});
