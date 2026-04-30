import React from "react";
import { createFieldRenderer } from "~/features/formModel/createFieldRenderer.js";
import { ReactComponent as DeleteIcon } from "@webiny/icons/delete.svg";
import { ReactComponent as AddIcon } from "@webiny/icons/add.svg";
import { Button, FormComponentDescription, Icon, Input, Separator } from "@webiny/admin-ui";
declare module "../../../features/formModel/abstractions.js" {
    interface IFieldRendererRegistry {
        dateTimeInputs: {
            fieldType: "datetime";
            settings: {
                type: "date" | "dateTime" | "dateTimeTimezone" | "time";
                addItemLabel?: string;
            };
        };
    }
}

export const DateTimeInputsRenderer = createFieldRenderer<"dateTimeInputs">(({ field }) => {
    const values = (field.value as string[]) ?? [];
    const inputType = field.rendererSettings?.type ?? "date";

    const updateAt = (index: number, val: string) => {
        const next = [...values];
        next[index] = val;
        field.onChange(next);
    };

    return (
        <div className={"flex flex-col gap-sm"}>
            <Separator labelPosition={"start"} variant={"accent"}>
                <span className={"text-accent-primary text-lg font-semibold"}>
                    {`${field.label ?? ""} ${values.length ? `(${values.length})` : ""}`}
                </span>
            </Separator>
            {field.description && <FormComponentDescription text={field.description} />}
            {values.map((val, index) => (
                <Input
                    key={index}
                    value={val}
                    onChange={value => updateAt(index, value as string)}
                    disabled={field.disabled}
                    label={`${field.label ?? "Value"} ${index + 1}`}
                    type={inputType}
                    endIcon={
                        <Icon
                            icon={<DeleteIcon />}
                            label={"Delete"}
                            onClick={() => field.removeItem(index)}
                            className={"cursor-pointer"}
                        />
                    }
                />
            ))}
            <Button
                disabled={field.disabled}
                variant={"tertiary"}
                icon={<AddIcon />}
                text={field.rendererSettings?.addItemLabel ?? "Add Value"}
                onClick={() => field.addItem("")}
            />
        </div>
    );
});
