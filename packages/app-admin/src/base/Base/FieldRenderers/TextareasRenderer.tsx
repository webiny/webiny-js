import React from "react";
import { observer } from "mobx-react-lite";
import { ReactComponent as DeleteIcon } from "@webiny/icons/delete_outline.svg";
import { ReactComponent as AddIcon } from "@webiny/icons/add.svg";
import {
    Button,
    DelayedOnChange,
    FormComponentDescription,
    IconButton,
    Separator,
    Textarea
} from "@webiny/admin-ui";
import type { IFieldVM } from "~/features/formModel/index.js";

declare module "../../../features/formModel/abstractions.js" {
    interface IFieldRendererRegistry {
        textareas: { fieldType: "text"; settings?: { addItemLabel?: string } };
    }
}

export const TextareasRenderer = observer(({ field }: { field: IFieldVM }) => {
    const values = (field.value as string[]) ?? [];
    const settings = field.rendererSettings as { addItemLabel?: string } | undefined;

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
                <div key={index} className={"relative"}>
                    <DelayedOnChange
                        value={val}
                        onChange={value => updateAt(index, value as string)}
                    >
                        <Textarea
                            disabled={field.disabled}
                            rows={5}
                            label={`Value ${index + 1}`}
                            placeholder={field.placeholder}
                        />
                    </DelayedOnChange>
                    <div className={"absolute top-xl right-sm z-10"}>
                        <IconButton
                            variant={"ghost"}
                            size={"md"}
                            icon={<DeleteIcon />}
                            onClick={() => removeAt(index)}
                        />
                    </div>
                </div>
            ))}
            <Button
                disabled={field.disabled}
                variant={"tertiary"}
                icon={<AddIcon />}
                text={settings?.addItemLabel ?? "Add Value"}
                onClick={append}
            />
        </div>
    );
});
