import React from "react";
import { observer } from "mobx-react-lite";
import { DelayedOnChange } from "@webiny/admin-ui";
import { Textarea } from "@webiny/admin-ui";
import type { IFieldVM } from "~/features/formModel/index.js";
import type { IFieldRendererRegistry } from "~/features/formModel/index.js";

declare module "../../../features/formModel/abstractions.js" {
    interface IFieldRendererRegistry {
        textarea: { fieldType: "text"; settings?: { rows?: number } };
    }
}

type TextareaSettings = NonNullable<IFieldRendererRegistry["textarea"]["settings"]>;

export const TextareaRenderer = observer(({ field }: { field: IFieldVM }) => {
    const settings = field.rendererSettings as TextareaSettings | undefined;
    return (
        <DelayedOnChange value={field.value} onChange={value => field.onChange(value)}>
            <Textarea
                label={field.label}
                placeholder={field.placeholder}
                description={field.description}
                note={field.note}
                required={field.required}
                disabled={field.disabled}
                validation={field.validation}
                onBlur={() => field.onBlur()}
                rows={settings?.rows ?? 5}
            />
        </DelayedOnChange>
    );
});
