import React from "react";
import { createFieldRenderer } from "webiny/admin/form";
import {
    FormComponentDescription,
    FormComponentLabel,
    FormComponentNote,
    Input
} from "webiny/admin/ui";

declare module "webiny/admin/form" {
    interface IFieldRendererRegistry {
        monthInput: {
            fieldType: "month";
            settings: undefined;
        };
    }
}

export const MonthRenderer = createFieldRenderer<"monthInput">(({ field }) => {
    return (
        <div className={"w-full"}>
            <FormComponentLabel
                text={field.label}
                required={field.required}
                disabled={field.disabled}
            />
            {field.description && <FormComponentDescription text={field.description} />}
            <Input
                value={(field.value as string) || ""}
                onChange={(value: string) => field.onChange(value || "")}
                disabled={field.disabled}
                placeholder={field.placeholder}
                type="month"
                label={null}
            />
            <FormComponentNote text={field.note} disabled={field.disabled} />
        </div>
    );
});
