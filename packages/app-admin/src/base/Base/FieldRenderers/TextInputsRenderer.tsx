import React from "react";
import { createFieldRenderer } from "~/features/formModel/createFieldRenderer.js";
import { ReactComponent as DeleteIcon } from "@webiny/icons/delete.svg";
import { ReactComponent as AddIcon } from "@webiny/icons/add.svg";
import {
    Button,
    DelayedOnChange,
    FormComponentDescription,
    FormComponentErrorMessage,
    Icon,
    Input,
    Separator
} from "@webiny/admin-ui";

declare module "../../../features/formModel/abstractions.js" {
    interface IFieldRendererRegistry {
        textInputs: { fieldType: "text"; settings?: { addItemLabel?: string } };
    }
}

export const TextInputsRenderer = createFieldRenderer<"textInputs">(({ field }) => {
    const values = (field.value as string[]) ?? [];

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
                <DelayedOnChange
                    key={index}
                    value={val}
                    onChange={value => updateAt(index, value as string)}
                >
                    <Input
                        disabled={field.disabled}
                        label={`Value ${index + 1}`}
                        placeholder={field.placeholder}
                        onEnter={() => field.addItem("")}
                        endIcon={
                            <Icon
                                icon={<DeleteIcon />}
                                label={"Delete"}
                                onClick={() => field.removeItem(index)}
                                className={"cursor-pointer"}
                            />
                        }
                    />
                </DelayedOnChange>
            ))}
            <Button
                disabled={field.disabled}
                variant={"tertiary"}
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
