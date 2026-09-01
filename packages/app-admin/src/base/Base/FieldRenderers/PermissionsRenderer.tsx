import React from "react";
import { createFieldRenderer } from "~/features/formModel/createFieldRenderer.js";
import { Permissions } from "~/components/Permissions/Permissions.js";

declare module "../../../features/formModel/abstractions.js" {
    interface IFieldRendererRegistry {
        permissions: { fieldType: "permissions"; settings: { id?: string } };
    }
}

export const PermissionsRenderer = createFieldRenderer(({ field }) => {
    const id = (field.rendererSettings?.id as string) || "new";

    return (
        <Permissions
            id={id}
            value={field.value as any[]}
            onChange={value => field.onChange(value)}
            validate={() => Promise.resolve(true)}
            validation={{ isValid: null }}
        />
    );
});
