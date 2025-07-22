import React from "react";
import { InputIcon, InputPrimitiveProps, inputVariants } from "~/Input";
import { Command, CommandOptionFormatted } from "~/Command";
import { Tag } from "~/Tag";
import { cn, cva, type VariantProps } from "~/utils";

const multiAutoCompleteInputVariants = cva("wby-relative placeholder:wby-text-neutral-dimmed", {
    variants: {
        disabled: {
            true: "wby-cursor-not-allowed disabled:wby-text-neutral-disabled disabled:placeholder:wby-text-neutral-disabled"
        }
    }
});

type MultiAutoCompleteInputProps = VariantProps<typeof multiAutoCompleteInputVariants> &
    InputPrimitiveProps & {
        changeValue: (value: string) => void;
        closeList: () => void;
        openList: () => void;
        placeholder: string;
        removeSelectedOption: (value: string) => void;
        selectedOptionRenderer?: (item: any, index: number) => React.ReactNode;
        selectedOptions: CommandOptionFormatted[];
        value: string;
    };

const MultiAutoCompleteInput = ({
    changeValue,
    closeList,
    disabled,
    endIcon,
    invalid,
    openList,
    placeholder,
    removeSelectedOption,
    selectedOptionRenderer,
    selectedOptions,
    size,
    startIcon,
    value,
    variant,
    className,
    inputRef: parentInputRef,
    ...props
}: MultiAutoCompleteInputProps) => {
    const [focused, setFocused] = React.useState<boolean>(false);
    const inputRef = React.useMemo<React.RefObject<HTMLInputElement>>(
        () =>
            parentInputRef && typeof parentInputRef !== "function"
                ? parentInputRef
                : React.createRef<HTMLInputElement>(),
        [parentInputRef]
    );

    const renderSelectedOptions = React.useCallback(
        (options: CommandOptionFormatted[]) => {
            return options.map((option, index) => {
                if (selectedOptionRenderer) {
                    if (!option.item) {
                        return null;
                    }
                    return selectedOptionRenderer.call(this, option.item, index);
                }

                return (
                    <Tag
                        key={`tag-${option.value}-${index}`}
                        variant={variant === "ghost-negative" ? "neutral-xstrong" : "neutral-muted"}
                        content={option.label}
                        onDismiss={() => removeSelectedOption(option.value)}
                    />
                );
            });
        },
        [selectedOptionRenderer, removeSelectedOption, variant]
    );

    return (
        <div
            {...props}
            className={cn(
                inputVariants({
                    variant,
                    size,
                    invalid
                }),
                multiAutoCompleteInputVariants({ disabled }),
                className
            )}
            aria-disabled={disabled}
            onClick={() => {
                if (disabled) {
                    return;
                }
                inputRef?.current?.focus();
                setFocused(true);
            }}
            data-disabled={disabled}
            data-focused={focused}
        >
            {startIcon && <InputIcon icon={startIcon} inputSize={size} />}
            <div className="wby-relative wby-flex wby-flex-wrap wby-flex-1 wby-gap-xs">
                {renderSelectedOptions(selectedOptions)}
                <Command.Input
                    className={"wby-bg-transparent wby-border-none wby-outline-none"}
                    value={value}
                    onValueChange={changeValue}
                    placeholder={placeholder}
                    disabled={disabled}
                    onBlur={() => {
                        setFocused(false);
                        closeList();
                    }}
                    onFocus={() => {
                        setFocused(true);
                        openList();
                    }}
                    inputElement={
                        <input
                            type="text"
                            ref={inputRef}
                            className={cn(multiAutoCompleteInputVariants({ disabled }))}
                        />
                    }
                />
            </div>
            {endIcon && <InputIcon icon={endIcon} inputSize={size} />}
        </div>
    );
};

export { MultiAutoCompleteInput, type MultiAutoCompleteInputProps };
