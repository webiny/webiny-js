import React from "react";
import { createObjectFieldRenderer } from "~/features/formModel/createFieldRenderer.js";
import { SingleValueDynamicZone } from "./SingleValueDynamicZone.js";
import { MultiValueDynamicZone } from "./MultiValueDynamicZone/index.js";

declare module "../../../../features/formModel/abstractions.js" {
    interface IFieldRendererRegistry {
        dynamicZone: {
            fieldType: "object";
            settings?: {
                open?: boolean;
                container?: boolean;
                addItemLabel?: string;
            };
        };
    }
}

export const DynamicZoneRenderer = createObjectFieldRenderer<"dynamicZone">(({ field }) => {
    const settings = field.rendererSettings ?? {};

    if (field.isList) {
        return (
            <MultiValueDynamicZone
                field={field}
                addItemLabel={settings.addItemLabel ?? "Add Item"}
                showContainer={settings.container !== false}
            />
        );
    }

    return (
        <SingleValueDynamicZone
            field={field}
            addItemLabel={settings.addItemLabel ?? "Add Item"}
            showContainer={field.rendererSettings?.container !== false}
        />
    );
});
