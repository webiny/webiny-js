import React from "react";
import { observer } from "mobx-react-lite";
import { ReactComponent as DeleteIcon } from "@webiny/icons/delete.svg";
import { ReactComponent as AddIcon } from "@webiny/icons/add.svg";
import { Button, DelayedOnChange, FormComponentDescription, Icon, Input, Separator } from "@webiny/admin-ui";
import type { IFieldVM } from "~/features/formModel/index.js";

declare module "../../../features/formModel/abstractions.js" {
    interface IFieldRendererRegistry {
        textInputs: { fieldType: "text"; settings?: { addValueButtonLabel?: string } };
    }
}

export const TextInputsRenderer = observer(({ field }: { field: IFieldVM }) => {
    const values = (field.value as string[]) ?? [];
    const settings = field.rendererSettings as { addValueButtonLabel?: string } | undefined;

    const updateAt = (index: number, val: string) => {
        const next = [...values];
        next[index] = val;
        field.onChange(next);
    };

    const removeAt = (index: number) => {
        const next = values.filter((_, i) => i !== index);
        field.onChange(next);
    };

    const append = () => {
        field.onChange([...values, ""]);
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
                        onEnter={append}
                        endIcon={
                            <Icon
                                icon={<DeleteIcon />}
                                label={"Delete"}
                                onClick={() => removeAt(index)}
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
                text={settings?.addValueButtonLabel ?? "Add Value"}
                onClick={append}
            />
        </div>
    );
});
