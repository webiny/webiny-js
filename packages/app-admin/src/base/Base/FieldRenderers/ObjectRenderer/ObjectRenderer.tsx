import React, { useEffect, useState } from "react";
import { Accordion } from "@webiny/admin-ui";
import { createObjectFieldRenderer } from "~/features/formModel/createFieldRenderer.js";
import { NestedLayout, useFieldValueFormatters } from "./ObjectFieldComponents.js";
import { resolveItemDescription, resolveItemTitle } from "./resolveItemTitle.js";
import { hasSubtreeFocusRequest } from "~/features/formModel/index.js";

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

export const ObjectRenderer = createObjectFieldRenderer<"objectAccordionSingle">(({ field }) => {
    const settings = field.rendererSettings;
    const formatters = useFieldValueFormatters();

    // Force the object accordion open when a focus request lands anywhere in
    // its subtree, so "jump to field" can cascade through collapsed levels.
    const focusInside = hasSubtreeFocusRequest(field.fields);
    const [open, setOpen] = useState(settings?.open ?? true);
    useEffect(() => {
        if (focusInside) {
            setOpen(true);
        }
    }, [focusInside]);

    if (settings?.container === false) {
        return <NestedLayout layout={field.layout} />;
    }

    return (
        <Accordion background={"base"} variant={"container"}>
            <Accordion.Item
                title={resolveItemTitle(
                    field.fields,
                    0,
                    field.label || "",
                    settings?.itemTitle,
                    formatters
                )}
                description={resolveItemDescription(
                    field.fields,
                    0,
                    settings?.itemDescription,
                    formatters
                )}
                open={open}
                onOpenChange={setOpen}
                className={"pl-sm"}
            >
                <NestedLayout layout={field.layout} />
            </Accordion.Item>
        </Accordion>
    );
});
