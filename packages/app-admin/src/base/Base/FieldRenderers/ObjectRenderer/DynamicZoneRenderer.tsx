import React from "react";
import { createObjectFieldRenderer } from "~/features/formModel/createFieldRenderer.js";
import { SingleValueDynamicZone } from "./SingleValueDynamicZone.js";
import { MultiValueDynamicZone } from "./MultiValueDynamicZone.js";

declare module "../../../../features/formModel/abstractions.js" {
    interface IFieldRendererRegistry {
        dynamicZone: {
            fieldType: "object";
            settings?: {
                container?: boolean;
            };
        };
    }
}

export const DynamicZoneRenderer = createObjectFieldRenderer<"dynamicZone">(({ field }) => {
    if (field.isList) {
        return (
            <MultiValueDynamicZone
                field={field}
                showContainer={field.rendererSettings?.container !== false}
            />
        );
    }

    return (
        <SingleValueDynamicZone
            field={field}
            showContainer={field.rendererSettings?.container !== false}
        />
    );
});
