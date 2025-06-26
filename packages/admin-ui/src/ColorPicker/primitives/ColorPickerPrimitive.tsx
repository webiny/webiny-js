import React from "react";
import { SketchPicker } from "react-color";
import { useColorPicker } from "./useColorPicker";
import { type InputPrimitiveProps, inputVariants } from "~/Input";
import { PopoverPrimitive, type PopoverPrimitiveContentProps } from "~/Popover";
import { cn, cva, makeDecoratable } from "~/utils";

const colorPickerVariants = cva("wby-cursor-pointer", {
    variants: {
        size: {
            md: ["wby-size-8", "wby-p-[calc(theme(padding.xs-plus)-theme(borderWidth.sm))] "],
            lg: ["wby-size-10", "wby-p-[calc(theme(padding.sm-plus)-theme(borderWidth.sm))]"],
            xl: ["wby-size-14", "wby-p-[calc(theme(padding.md)-theme(borderWidth.sm))]"]
        },
        disabled: {
            true: "wby-pointer-events-none"
        }
    },
    defaultVariants: {
        size: "lg"
    }
});

interface ColorPickerPrimitiveProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "onChange"> {
    /**
     * Callback triggered when the open state changes.
     */
    onOpenChange?: (open: boolean) => void;
    /**
     * Callback triggered when the value changes.
     */
    onChange?: (value: string) => void;
    /**
     * Callback triggered when the color selection is complete.
     * This is called after the user has finished selecting a color.
     */
    onChangeComplete?: (value: string) => void;
    /**
     * Optional selected value.
     */
    value?: string;
    /**
     * If true, the color picker will be disabled.
     */
    disabled?: boolean;
    /**
     * Popover alignment.
     */
    align?: PopoverPrimitiveContentProps["align"];
    /**
     * Size of the input field.
     * Refer to `InputPrimitiveProps["size"]` for possible values.
     */
    size?: InputPrimitiveProps["size"];
    /**
     * Variant of the input field.
     * Refer to `InputPrimitiveProps["variant"]` for possible values.
     */
    variant?: InputPrimitiveProps["variant"];
    /**
     * Indicates if the input field is invalid.
     * Refer to `InputPrimitiveProps["invalid"]` for possible values.
     */
    invalid?: InputPrimitiveProps["invalid"];
}

const DecoratableColorPickerPrimitive = ({
    align,
    disabled,
    invalid,
    size,
    variant,
    value,
    onOpenChange,
    onChange,
    onChangeComplete,
    ...props
}: ColorPickerPrimitiveProps) => {
    const { vm, setColor, commitColor, setOpen } = useColorPicker({
        value,
        onOpenChange,
        onChange,
        onChangeComplete
    });

    return (
        <div {...props}>
            <PopoverPrimitive open={vm.open} onOpenChange={setOpen}>
                <PopoverPrimitive.Trigger asChild>
                    <div
                        data-disabled={disabled}
                        className={cn(
                            inputVariants({
                                size,
                                variant,
                                invalid
                            }),
                            colorPickerVariants({ size, disabled })
                        )}
                    >
                        <div
                            className={"wby-rounded-xs wby-size-full"}
                            style={{ backgroundColor: vm.value }}
                        />
                    </div>
                </PopoverPrimitive.Trigger>
                <PopoverPrimitive.Content align={align} onEscapeKeyDown={() => setOpen(false)}>
                    <SketchPicker
                        color={vm.value}
                        onChange={setColor}
                        onChangeComplete={commitColor}
                    />
                </PopoverPrimitive.Content>
            </PopoverPrimitive>
        </div>
    );
};

const ColorPickerPrimitive = makeDecoratable(
    "ColorPickerPrimitive",
    DecoratableColorPickerPrimitive
);

export { ColorPickerPrimitive, type ColorPickerPrimitiveProps };
