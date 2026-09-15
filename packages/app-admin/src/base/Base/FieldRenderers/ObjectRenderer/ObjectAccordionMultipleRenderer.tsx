import React, { useEffect, useMemo } from "react";
import { observer } from "mobx-react-lite";
import { Accordion } from "@webiny/admin-ui";
import { useContainer } from "@webiny/app";
import { createObjectFieldRenderer } from "~/features/formModel/createFieldRenderer.js";
import { ListItemRenderer, AddItemButton } from "./ObjectFieldComponents.js";
import { SortablePresenter } from "~/presentation/sortable/index.js";
import type { IObjectFieldVM } from "~/features/formModel/index.js";

declare module "../../../../features/formModel/abstractions.js" {
    interface IFieldRendererRegistry {
        objectAccordionMultiple: {
            fieldType: "object";
            settings?: {
                open?: boolean;
                container?: boolean;
                itemTitle?: string | ((data: Record<string, unknown>, index: number) => string);
                itemDescription?:
                    | string
                    | ((data: Record<string, unknown>, index: number) => string);
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
            <Accordion background={"base"} variant={"container"}>
                <Accordion.Item title={label} description={field.description} defaultOpen={true}>
                    <div className={"flex flex-col gap-lg"}>
                        <ListItems field={field} />
                        {addButton}
                    </div>
                </Accordion.Item>
            </Accordion>
        );
    }
);

interface ListItemsProps {
    field: IObjectFieldVM;
}

const ListItems = observer(({ field }: ListItemsProps) => {
    const settings = field.rendererSettings as
        | {
              itemTitle?: string | ((data: Record<string, unknown>, index: number) => string);
              itemDescription?: string | ((data: Record<string, unknown>, index: number) => string);
          }
        | undefined;

    const container = useContainer();
    const sortable = useMemo(() => {
        const p = container.resolve(SortablePresenter);
        p.init({ type: `obj:${field.name}`, onReorder: (from, to) => field.moveItem(from, to) });
        return p;
    }, []);

    useEffect(() => {
        return () => sortable.dispose();
    }, [sortable]);

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
                    itemDescription={settings?.itemDescription}
                    disabled={field.disabled}
                    sortable={sortable.getItemProps(index)}
                />
            ))}
        </div>
    );
});
