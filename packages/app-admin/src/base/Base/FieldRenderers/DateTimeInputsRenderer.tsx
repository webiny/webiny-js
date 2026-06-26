import React from "react";
import { createFieldRenderer } from "~/features/formModel/createFieldRenderer.js";
import { ReactComponent as DeleteIcon } from "@webiny/icons/delete.svg";
import { ReactComponent as AddIcon } from "@webiny/icons/add.svg";
import {
    Button,
    DatePickerPrimitive,
    type DatePickerPrimitiveProps,
    FormComponentDescription,
    FormComponentErrorMessage,
    Separator
} from "@webiny/admin-ui";
import { IconButton } from "@webiny/admin-ui";

declare module "../../../features/formModel/abstractions.js" {
    interface IFieldRendererRegistry {
        dateTimeInputs: {
            fieldType: "datetime";
            settings: {
                type:
                    | "date"
                    | "time"
                    | "dateTimeLocal"
                    | "dateTimeTz"
                    | "dateTimeWithoutTimezone"
                    | "dateTimeWithTimezone"
                    | "month"
                    | "week";
                addItemLabel?: string;
                displayFormat?: string;
                weekStartsOn?: 0 | 1 | 2 | 3 | 4 | 5 | 6;
            };
        };
    }
}

type StringPickerType = "date" | "time" | "dateTimeLocal" | "dateTimeTz" | "month" | "week";

const PICKER_TYPE_MAP: Record<string, StringPickerType> = {
    date: "date",
    time: "time",
    dateTimeLocal: "dateTimeLocal",
    dateTimeTz: "dateTimeTz",
    dateTimeWithoutTimezone: "dateTimeLocal",
    dateTimeWithTimezone: "dateTimeTz",
    month: "month",
    week: "week"
};

export const DateTimeInputsRenderer = createFieldRenderer<"dateTimeInputs">(({ field }) => {
    const values = (field.value as string[]) ?? [];
    const settingsType = field.rendererSettings?.type ?? "date";
    const pickerType: StringPickerType = PICKER_TYPE_MAP[settingsType] ?? "date";

    const updateAt = (index: number, val: string | undefined) => {
        const next = [...values];
        next[index] = val ?? "";
        field.onChange(next);
    };

    return (
        <div className="flex flex-col gap-sm">
            <Separator labelPosition="start" variant="accent">
                <span className="text-accent-primary text-lg font-semibold">
                    {`${field.label ?? ""} ${values.length ? `(${values.length})` : ""}`}
                </span>
            </Separator>
            {field.description && <FormComponentDescription text={field.description} />}
            {values.map((val, index) => (
                <div key={index} className="flex items-center gap-sm">
                    <div className="flex-1">
                        <DatePickerPrimitive
                            {...({
                                type: pickerType,
                                value: val || undefined,
                                onChange: (v: string | undefined) => updateAt(index, v),
                                disabled: field.disabled,
                                displayFormat: field.rendererSettings?.displayFormat,
                                weekStartsOn: field.rendererSettings?.weekStartsOn
                            } as DatePickerPrimitiveProps)}
                        />
                    </div>
                    <IconButton
                        icon={<DeleteIcon />}
                        onClick={e => {
                            e.stopPropagation();
                            field.removeItem(index);
                        }}
                        size="lg"
                        variant="ghost"
                    />
                </div>
            ))}
            <Button
                disabled={field.disabled}
                variant="tertiary"
                icon={<AddIcon />}
                text={field.rendererSettings?.addItemLabel ?? "Add Value"}
                onClick={() => field.addItem("")}
            />
            <FormComponentErrorMessage
                text={field.validation.message}
                invalid={field.validation.isValid === false}
                disabled={field.disabled}
            />
        </div>
    );
});
