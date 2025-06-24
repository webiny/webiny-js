import React, { KeyboardEvent } from "react";
import { Command } from "~/Command";
import { PopoverPrimitive } from "~/Popover";
import { InputPrimitiveProps } from "~/Input";
import { makeDecoratable } from "~/utils";
import { useMultiAutoComplete } from "./useMultiAutoComplete";
import {
    MultiAutoCompleteInput,
    MultiAutoCompleteInputIcons,
    MultiAutoCompleteList
} from "./components";
import { MultiAutoCompleteOption } from "../domains";
import { Icon } from "~/Icon";

interface MultiAutoCompletePrimitiveProps {
    /**
     * Allows free input of values not present in the options.
     */
    allowFreeInput?: boolean;
    /**
     * Indicates if the reset action should be displayed.
     */
    displayResetAction?: boolean;
    /**
     * Indicates if the field is disabled.
     */
    disabled?: boolean;
    /**
     * Message to display when there are no options.
     */
    emptyMessage?: React.ReactNode;
    /**
     * Indicates if the input field is invalid.
     * Refer to `InputPrimitiveProps["invalid"]` for possible values.
     */
    invalid?: InputPrimitiveProps["invalid"];
    /**
     * Message to display when there are no options loaded or selected.
     * Use it to invite the user to interact with the autocomplete by typing a value.
     */
    initialMessage?: React.ReactNode;
    /**
     * Reference to the input element.
     */
    inputRef?: React.Ref<HTMLInputElement>;
    /**
     * Accessible label for the command menu. Not shown visibly.
     */
    label?: React.ReactNode;
    /**
     * Indicates if the autocomplete is loading options.
     */
    loading?: boolean;
    /**
     * Message to display while loading options.
     */
    loadingMessage?: React.ReactNode;
    /**
     * Callback triggered when the open state changes.
     */
    onOpenChange?: (open: boolean) => void;
    /**
     * Callback triggered when a value has been searched by the user.
     */
    onValueSearch?: (value: string) => void;
    /**
     * Callback triggered when the values change.
     */
    onValuesChange: (values: string[]) => void;
    /**
     * Callback triggered to reset the values.
     */
    onValuesReset?: () => void;
    /**
     * List of options for the autocomplete.
     */
    options?: MultiAutoCompleteOption[];
    /**
     * Custom renderer for the options.
     */
    optionRenderer?: (item: any, index: number) => React.ReactNode;
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
     * Custom renderer for the selected options.
     */
    selectedOptionRenderer?: (item: any, index: number) => React.ReactNode;
    /**
     * Icon to be displayed at the start of the input field.
     */
    startIcon?: React.ReactElement<typeof Icon> | React.ReactElement;
    /**
     * Ensures that each value is unique.
     */
    uniqueValues?: boolean;
    /**
     * Variant of the input field.
     * Refer to `InputPrimitiveProps["variant"]` for possible values.
     */
    variant?: InputPrimitiveProps["variant"];
    /**
     * Optional selected items.
     */
    values?: string[];
}

const DecoratableMultiAutoCompletePrimitive = (props: MultiAutoCompletePrimitiveProps) => {
    const {
        vm,
        setListOpenState,
        setSelectedOption,
        searchOption,
        removeSelectedOption,
        resetSelectedOptions,
        createOption
    } = useMultiAutoComplete(props);

    const handleKeyDown = React.useCallback(
        (event: KeyboardEvent<HTMLDivElement>) => {
            if (props.disabled) {
                return;
            }

            if (!vm.optionsListVm.open) {
                setListOpenState(true);
            }

            if (event.key.toLowerCase() === "escape") {
                setListOpenState(false);
            }
        },
        [props.disabled, setListOpenState, setSelectedOption, vm.optionsListVm.open]
    );

    const handleSelectOption = React.useCallback(
        (value: string) => {
            setSelectedOption(value);
            setListOpenState(false);
        },
        [setSelectedOption, setListOpenState]
    );

    const handleCreateOption = React.useCallback(
        (value: string) => {
            createOption(value);
            setListOpenState(false);
        },
        [createOption, setListOpenState]
    );

    return (
        <PopoverPrimitive open={vm.optionsListVm.open} onOpenChange={() => setListOpenState(true)}>
            <Command label={String(props.label)} onKeyDown={handleKeyDown}>
                <PopoverPrimitive.Trigger asChild>
                    <span>
                        <MultiAutoCompleteInput
                            inputRef={props.inputRef}
                            value={vm.inputVm.value}
                            placeholder={vm.inputVm.placeholder}
                            changeValue={searchOption}
                            closeList={() => setListOpenState(false)}
                            openList={() => setListOpenState(true)}
                            variant={props.variant}
                            size={props.size}
                            invalid={props.invalid}
                            removeSelectedOption={removeSelectedOption}
                            selectedOptionRenderer={props.selectedOptionRenderer}
                            selectedOptions={vm.selectedOptionsVm.options}
                            disabled={props.disabled}
                            startIcon={props.startIcon}
                            endIcon={
                                <MultiAutoCompleteInputIcons
                                    inputSize={props.size}
                                    displayResetAction={
                                        !vm.selectedOptionsVm.empty && vm.inputVm.displayResetAction
                                    }
                                    disabled={props.disabled}
                                    loading={props.loading}
                                    onResetValue={resetSelectedOptions}
                                    onOpenChange={() => setListOpenState(!vm.optionsListVm.open)}
                                />
                            }
                        />
                    </span>
                </PopoverPrimitive.Trigger>
                <PopoverPrimitive.Content
                    style={{ width: "var(--radix-popover-trigger-width)" }}
                    onOpenAutoFocus={e => e.preventDefault()}
                >
                    <MultiAutoCompleteList
                        emptyMessage={vm.optionsListVm.emptyMessage}
                        empty={vm.optionsListVm.empty}
                        loading={props.loading}
                        loadingMessage={vm.optionsListVm.loadingMessage}
                        onOptionCreate={handleCreateOption}
                        onOptionSelect={handleSelectOption}
                        optionRenderer={props.optionRenderer}
                        options={vm.optionsListVm.options}
                        temporaryOption={vm.temporaryOptionVm.option}
                    />
                </PopoverPrimitive.Content>
            </Command>
        </PopoverPrimitive>
    );
};

const MultiAutoCompletePrimitive = makeDecoratable(
    "MultiAutoCompletePrimitive",
    DecoratableMultiAutoCompletePrimitive
);

export { MultiAutoCompletePrimitive, type MultiAutoCompletePrimitiveProps };
