import * as React from "react";
import { ReactComponent as Close } from "@webiny/icons/close.svg";
import { Select as SelectPrimitives } from "radix-ui";
import { type VariantProps } from "~/utils";
import { useSelect } from "./useSelect";
import { SelectOptionDto, SelectOptionFormatted } from "../domains";
import { IconButton } from "~/Button";
import { Icon } from "~/Icon";
import {
    SelectContent,
    SelectItem,
    SelectLabel,
    SelectSeparator,
    SelectTrigger,
    selectTriggerVariants
} from "./components";

const SelectRoot = SelectPrimitives.Root;

const SelectGroup = SelectPrimitives.Group;

const SelectValue = SelectPrimitives.Value;

/**
 * Trigger
 */
type SelectTriggerVm = {
    placeholder: string;
    hasValue: boolean;
    displayResetAction: boolean;
};

type SelectTriggerProps = SelectPrimitives.SelectValueProps &
    SelectTriggerVm & {
        size: VariantProps<typeof selectTriggerVariants>["size"];
        variant: VariantProps<typeof selectTriggerVariants>["variant"];
        invalid: VariantProps<typeof selectTriggerVariants>["invalid"];
        startIcon?: React.ReactElement;
        endIcon?: React.ReactElement;
        onValueReset: () => void;
        disabled?: boolean;
    };

const Trigger = ({
    hasValue,
    size,
    variant,
    startIcon,
    endIcon,
    invalid,
    onValueReset,
    disabled,
    displayResetAction,
    ...props
}: SelectTriggerProps) => {
    const resetButton = React.useMemo(() => {
        if (!hasValue || !displayResetAction) {
            return undefined;
        }

        return (
            <IconButton
                onPointerDown={event => {
                    event.stopPropagation();
                    onValueReset();
                }}
                icon={
                    <span>
                        <Icon icon={<Close />} label={"Reset"} />
                    </span>
                }
                size={"xs"}
                variant={"secondary"}
                disabled={disabled}
                asChild
            />
        );
    }, [hasValue, onValueReset, disabled]);

    return (
        <SelectTrigger
            size={size}
            variant={variant}
            invalid={invalid}
            startIcon={startIcon}
            endIcon={endIcon}
            resetButton={resetButton}
        >
            <div className={"wby-flex-1 wby-text-left wby-truncate"}>
                <SelectValue {...props} />
            </div>
        </SelectTrigger>
    );
};

/**
 * SelectOptions
 */
type SelectOptionsVm = {
    options: SelectOptionFormatted[];
};

type SelectOptionsProps = SelectOptionsVm;

const SelectOptions = (props: SelectOptionsProps) => {
    const renderOptions = React.useCallback((items: SelectOptionFormatted[]) => {
        return items.map((item, index) => {
            const elements = [];

            if (item.options.length > 0) {
                // Render as a group if there are nested options
                elements.push(
                    <SelectGroup key={`group-${index}`}>
                        <SelectLabel>{item.label}</SelectLabel>
                        {renderOptions(item.options)}
                    </SelectGroup>
                );
            }

            if (item.value) {
                // Render as a select item if there are no nested options
                elements.push(
                    <SelectItem
                        key={`item-${item.value}`}
                        value={item.value}
                        disabled={item.disabled}
                    >
                        {item.label}
                    </SelectItem>
                );
            }

            // Conditionally render the separator if hasSeparator is true
            if (item.separator) {
                elements.push(<SelectSeparator key={`separator-${item.value ?? index}`} />);
            }

            return elements;
        });
    }, []);

    return <SelectContent>{renderOptions(props.options)}</SelectContent>;
};

/**
 * SelectRenderer
 */
type SelectRootProps = SelectPrimitives.SelectProps;

type SelectRendererProps = {
    selectRootProps: Omit<SelectRootProps, "onValueChange">;
    selectTriggerProps: Omit<SelectTriggerProps, "onValueReset">;
    selectOptionsProps: SelectOptionsProps;
    onValueChange: (value: string) => void;
    onValueReset: () => void;
};

const SelectPrimitiveRenderer = ({
    selectRootProps,
    selectTriggerProps,
    selectOptionsProps,
    onValueChange,
    onValueReset
}: SelectRendererProps) => {
    return (
        <SelectRoot {...selectRootProps} onValueChange={onValueChange}>
            <Trigger {...selectTriggerProps} onValueReset={onValueReset} />
            <SelectOptions {...selectOptionsProps} />
        </SelectRoot>
    );
};

/**
 * Select
 */
type SelectOption = SelectOptionDto | string;

interface SelectPrimitiveProps {
    /**
     * Whether to display the reset action button.
     */
    displayResetAction?: boolean;
    /**
     * Indicates if the field is disabled.
     */
    disabled?: boolean;
    /**
     * Icon to display at the end of the select trigger.
     */
    endIcon?: React.ReactElement;
    /**
     * Whether the select input is invalid.
     */
    invalid?: VariantProps<typeof selectTriggerVariants>["invalid"];
    /**
     * Callback function called when the value changes.
     */
    onChange?: (value: string) => void;
    /**
     * Callback function called when the open state changes.
     */
    onOpenChange?: (open: boolean) => void;
    /**
     * Callback function called when the value is reset.
     */
    onValueReset?: () => void;
    /**
     * Array of options to display in the select dropdown.
     */
    options?: SelectOption[];
    /**
     * Placeholder text to display when no value is selected.
     */
    placeholder?: string;
    /**
     * Size variant of the select trigger.
     */
    size?: VariantProps<typeof selectTriggerVariants>["size"];
    /**
     * Icon to display at the start of the select trigger.
     */
    startIcon?: React.ReactElement;
    /**
     * The value of the select input.
     */
    value?: string;
    /**
     * Style variant of the select trigger.
     */
    variant?: VariantProps<typeof selectTriggerVariants>["variant"];
}

const SelectPrimitive = (props: SelectPrimitiveProps) => {
    const { vm, changeValue, resetValue } = useSelect(props);
    const { size, variant, startIcon, endIcon, invalid, disabled, ...selectRootProps } = props;

    return (
        <SelectPrimitiveRenderer
            selectRootProps={{ ...selectRootProps, disabled }}
            selectTriggerProps={{
                ...vm.selectTrigger,
                size,
                variant,
                startIcon,
                endIcon,
                invalid,
                disabled
            }}
            selectOptionsProps={vm.selectOptions}
            onValueChange={changeValue}
            onValueReset={resetValue}
        />
    );
};

export {
    SelectPrimitive,
    type SelectPrimitiveProps,
    type SelectOptionsVm,
    type SelectTriggerVm,
    type SelectOption
};
