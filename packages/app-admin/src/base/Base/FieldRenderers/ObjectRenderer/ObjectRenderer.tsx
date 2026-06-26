import React from "react";
import { Accordion } from "@webiny/admin-ui";
import { createObjectFieldRenderer } from "~/features/formModel/createFieldRenderer.js";
import { NestedLayout } from "./ObjectFieldComponents.js";
import type { IObjectFieldVM } from "~/features/formModel/index.js";

declare module "../../../../features/formModel/abstractions.js" {
    interface IFieldRendererRegistry {
        objectAccordionSingle: {
            fieldType: "object";
            settings?: {
                open?: boolean;
                container?: boolean;
                itemTitle?: string | ((data: Record<string, unknown>) => string);
                itemDescription?: string | ((data: Record<string, unknown>) => string);
            };
        };
    }
}

function resolveTitle(
    field: IObjectFieldVM,
    itemTitle: string | ((data: Record<string, unknown>) => string) | undefined
): string | undefined {
    if (!itemTitle) {
        return field.label;
    }

    if (typeof itemTitle === "string") {
        const child = field.fields.find(f => f.name === itemTitle);
        return (child ? String(child.value ?? "") : "") || field.label;
    }

    const data: Record<string, unknown> = {};
    for (const child of field.fields) {
        data[child.name] = child.value;
    }
    return itemTitle(data) || field.label;
}

function resolveDescription(
    field: IObjectFieldVM,
    itemDescription: string | ((data: Record<string, unknown>) => string) | undefined
): string | undefined {
    if (!itemDescription) {
        return undefined;
    }

    if (typeof itemDescription === "string") {
        const child = field.fields.find(f => f.name === itemDescription);
        return (child ? String(child.value ?? "") : "") || undefined;
    }

    const data: Record<string, unknown> = {};
    for (const child of field.fields) {
        data[child.name] = child.value;
    }
    return itemDescription(data) || undefined;
}

export const ObjectRenderer = createObjectFieldRenderer<"objectAccordionSingle">(({ field }) => {
    const settings = field.rendererSettings;

    if (settings?.container === false) {
        return <NestedLayout layout={field.layout} />;
    }

    return (
        <Accordion background={"base"} variant={"container"}>
            <Accordion.Item
                title={resolveTitle(field, settings?.itemTitle)}
                description={resolveDescription(field, settings?.itemDescription)}
                defaultOpen={settings?.open ?? true}
                className={"pl-sm"}
            >
                <NestedLayout layout={field.layout} />
            </Accordion.Item>
        </Accordion>
    );
});
