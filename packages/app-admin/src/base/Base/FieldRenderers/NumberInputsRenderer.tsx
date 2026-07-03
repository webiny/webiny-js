import React from "react";
import { createFieldRenderer } from "~/features/formModel/createFieldRenderer.js";
import { ReactComponent as DeleteIcon } from "@webiny/icons/delete.svg";
import { ReactComponent as AddIcon } from "@webiny/icons/add.svg";
import {
    Button,
    DelayedOnChange,
    FormComponentDescription,
    FormComponentErrorMessage,
    IconButton,
    Input,
    Separator
} from "@webiny/admin-ui";

declare module "../../../features/formModel/abstractions.js" {
    interface IFieldRendererRegistry {
        numberInputs: { fieldType: "number"; settings?: { addItemLabel?: string } };
    }
}

export const NumberInputsRenderer = createFieldRenderer<"numberInputs">(({ field }) => {
    const values = Array.isArray(field.value) ? field.value : [];

    const updateAt = (index: number, val: unknown) => {
        const next = [...values];
        next[index] = val as number;
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
                <div key={index} className={"flex items-end gap-sm"}>
                    <div className={"flex-1"}>
                        <DelayedOnChange value={val} onChange={value => updateAt(index, value)}>
                            <Input
                                disabled={field.disabled}
                                label={`Value ${index + 1}`}
                                placeholder={field.placeholder}
                                type="number"
                                onEnter={() => field.addItem("")}
                            />
                        </DelayedOnChange>
                    </div>
                    <IconButton
                        icon={<DeleteIcon />}
                        onClick={e => {
                            e.stopPropagation();
                            field.removeItem(index);
                        }}
                        size={"lg"}
                        variant={"ghost"}
                    />
                </div>
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
