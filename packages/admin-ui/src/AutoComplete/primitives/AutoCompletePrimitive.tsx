import React, { KeyboardEvent } from "react";
import { Command } from "~/Command";
import { PopoverPrimitive } from "~/Popover";
import { InputPrimitiveProps } from "~/Input";
import { useAutoComplete } from "./useAutoComplete";
import { AutoCompleteInputIcons, AutoCompleteList } from "./components";
import { AutoCompleteOption } from "../domains";
import { makeDecoratable } from "~/utils";
import { Icon } from "~/Icon";

interface AutoCompletePrimitiveProps {
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
     * Message to display when there are no options loaded or selected.
     * Use it to invite the user to interact with the autocomplete by typing a value.
     */
    initialMessage?: React.ReactNode;
    /**
     * Reference to the input element.
     */
    inputRef?: React.Ref<HTMLInputElement>;
    /**
     * Indicates if the input field is invalid.
     * Refer to `InputPrimitiveProps["invalid"]` for possible values.
     */
    invalid?: InputPrimitiveProps["invalid"];
    /**
     * Accessible label for the command menu. Not shown visibly.
     */
    label?: string;
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
     * Callback triggered to reset the value.
     */
    onValueReset?: () => void;
    /**
     * Callback triggered when a value has been searched by the user.
     */
    onValueSearch?: (value: string) => void;
    /**
     * Callback triggered when the value changes.
     */
    onValueChange: (value: string) => void;
    /**
     * List of options for the autocomplete.
     */
    options?: AutoCompleteOption[];
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
    value?: string;
}

const DecoratableAutoCompletePrimitive = (props: AutoCompletePrimitiveProps) => {
    const {
        vm,
        setListOpenState,
        setSelectedOption,
        searchOption,
        resetSelectedOption,
        showSelectedOption
    } = useAutoComplete(props);

    const handleKeyDown = React.useCallback(
        (event: KeyboardEvent<HTMLDivElement>) => {
            if (props.disabled) {
                return;
            }

            if (event.key.toLowerCase() === "escape") {
                setListOpenState(false);
            } else {
                setListOpenState(true);
            }
        },
        [props.disabled, setListOpenState]
    );

    const handleSelectOption = React.useCallback(
        (value: string) => {
            setSelectedOption(value);
            setListOpenState(false);
        },
        [setSelectedOption, setListOpenState]
    );

    const handleOnBlur = React.useCallback(() => {
        setListOpenState(false);
        showSelectedOption();
    }, [setListOpenState]);

    return (
        <PopoverPrimitive open={vm.optionsListVm.open} onOpenChange={() => setListOpenState(true)}>
            <Command label={String(props.label)} onKeyDown={handleKeyDown}>
                <PopoverPrimitive.Trigger asChild>
                    <span>
                        <Command.Input
                            inputRef={props.inputRef}
                            value={vm.inputVm.value}
                            onValueChange={searchOption}
                            placeholder={vm.inputVm.placeholder}
                            size={props.size}
                            variant={props.variant}
                            disabled={props.disabled}
                            invalid={props.invalid}
                            startIcon={props.startIcon}
                            endIcon={
                                <AutoCompleteInputIcons
                                    inputSize={props.size}
                                    inputVariant={props.variant}
                                    displayResetAction={vm.inputVm.displayResetAction}
                                    disabled={props.disabled}
                                    loading={props.loading}
                                    onResetValue={resetSelectedOption}
                                    onOpenChange={() => setListOpenState(!vm.optionsListVm.open)}
                                />
                            }
                            onBlur={handleOnBlur}
                            onFocus={() => setListOpenState(true)}
                        />
                    </span>
                </PopoverPrimitive.Trigger>
                <PopoverPrimitive.Content
                    style={{ width: "var(--radix-popover-trigger-width)" }}
                    onOpenAutoFocus={e => e.preventDefault()}
                >
                    <AutoCompleteList
                        options={vm.optionsListVm.options}
                        onOptionSelect={handleSelectOption}
                        empty={vm.optionsListVm.empty}
                        loading={props.loading}
                        loadingMessage={vm.optionsListVm.loadingMessage}
                        emptyMessage={vm.optionsListVm.emptyMessage}
                        optionRenderer={props.optionRenderer}
                    />
                </PopoverPrimitive.Content>
            </Command>
        </PopoverPrimitive>
    );
};

const AutoCompletePrimitive = makeDecoratable(
    "AutoCompletePrimitive",
    DecoratableAutoCompletePrimitive
);

export { AutoCompletePrimitive, type AutoCompletePrimitiveProps };
