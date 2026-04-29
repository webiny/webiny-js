import React from "react";
import { observer } from "mobx-react-lite";
import { Tags } from "@webiny/admin-ui";
import type { IFieldVM } from "~/features/formModel/index.js";

declare module "../../../features/formModel/abstractions.js" {
    interface IFieldRendererRegistry {
        tags: { fieldType: "text"; settings: undefined };
    }
}

export const TagsRenderer = observer(({ field }: { field: IFieldVM }) => {
    const value = (field.value as string[]) ?? [];

    return (
        <Tags
            label={field.label}
            placeholder={field.placeholder || "Add values"}
            description={field.description}
            note={field.note}
            required={field.required}
            disabled={field.disabled}
            validation={field.validation}
            value={value}
            onChange={value => field.onChange(value)}
        />
    );
});
