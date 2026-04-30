import React from "react";
import { Accordion } from "@webiny/admin-ui";
import { createObjectFieldRenderer } from "~/features/formModel/createFieldRenderer.js";
import { NestedLayout } from "./ObjectFieldComponents.js";

declare module "../../../../features/formModel/abstractions.js" {
    interface IFieldRendererRegistry {
        objectAccordionSingle: {
            fieldType: "object";
            settings?: {
                open?: boolean;
            };
        };
    }
}

export const ObjectRenderer = createObjectFieldRenderer<"objectAccordionSingle">(({ field }) => {
    return (
        <Accordion background={"base"} variant={"container"}>
            <Accordion.Item title={field.label} defaultOpen={true} className={"pl-sm"}>
                <NestedLayout layout={field.layout} />
            </Accordion.Item>
        </Accordion>
    );
});
