import React, { useMemo } from "react";
import { ReactComponent as AddIcon } from "@webiny/icons/add.svg";
import { makeDecoratable } from "~/utils";
import { useTags } from "./useTags";
import { InputPrimitive, type InputPrimitiveProps } from "~/Input";
import { Tag } from "~/Tag";
import { IconButton } from "~/Button";
import type { Icon } from "~/Icon";

interface TagsPrimitiveProps
    extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size" | "onChange"> {
    /**
     * Indicates if the field is disabled.
     */
    disabled?: boolean;
    /**
     * Reference to the input element.
     */
    inputRef?: React.Ref<HTMLInputElement>;
    /**
     * Indicates if the input field is invalid.
     */
    invalid?: boolean;
    /**
     * Callback triggered when a tag is added or removed.
     */
    onChange?: (values: string[]) => void;
    /**
     * Callback triggered when the input value changes.
     */
    onValueInput?: (value: string) => void;
    /**
     * Callback triggered when the value is added to the list.
     */
    onValueAdd?: (value: string) => void;
    /**
     * Callback triggered when a tag is removed.
     */
    onValueRemove?: (value: string) => void;
    /**
     * Placeholder text for the input field.
     */
    placeholder?: string;
    /**
     * Size of the input field.
     * Refer to `InputPrimitiveProps["size"]` for possible values.
     */
    size?: InputPrimitiveProps["size"];
    /**
     * Icon to be displayed at the start of the input field.
     */
    startIcon?: React.ReactElement<typeof Icon> | React.ReactElement;
    /**
     * Variant of the input field.
     * Refer to `InputPrimitiveProps["variant"]` for possible values.
     */
    variant?: InputPrimitiveProps["variant"];
    /**
     * Optional selected item.
     */
    value?: string[];
    /**
     * Protected values cannot be removed by the user, these can be simple strings or regex patterns.
     */
    protectedValues?: string[];
}

const DecoratableTagsPrimitive = (props: TagsPrimitiveProps) => {
    const { vm, inputValue, addValue, removeValue } = useTags(props);

    const inputProps: InputPrimitiveProps = useMemo(
        () => ({
            disabled: props.disabled,
            inputRef: props.inputRef,
            invalid: props.invalid,
            onChange: inputValue,
            placeholder: props.placeholder,
            size: props.size,
            variant: props.variant
        }),
        [props]
    );

    // When user press Enter, add the current input value as a tag
    const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
        if (event.key === "Enter" && event.target) {
            event.preventDefault();
            addValue();
        }
    };

    return (
        <div>
            <InputPrimitive
                {...inputProps}
                {...vm.inputVm}
                onChange={inputValue}
                onKeyDown={handleKeyDown}
                startIcon={props.startIcon}
                endIcon={
                    <IconButton
                        onClick={addValue}
                        icon={<AddIcon />}
                        variant={"ghost"}
                        disabled={inputProps.disabled}
                    />
                }
            />

            {vm.valuesVm.values.length > 0 && (
                <div className={"wby-mt-sm wby-flex wby-flex-wrap wby-gap-xs"}>
                    {vm.valuesVm.values.map(tag => (
                        <Tag
                            key={tag.id}
                            content={tag.label}
                            onDismiss={!tag.protected ? () => removeValue(tag.label) : undefined}
                            variant={"neutral-muted"}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

const TagsPrimitive = makeDecoratable("TagsPrimitive", DecoratableTagsPrimitive);

export { TagsPrimitive, type TagsPrimitiveProps };
