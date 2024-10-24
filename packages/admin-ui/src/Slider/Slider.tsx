import * as React from "react";
import * as SliderPrimitive from "@radix-ui/react-slider";
import { makeDecoratable } from "@webiny/react-composition";
import { cn } from "~/utils";
import { cva, type VariantProps } from "class-variance-authority";

/**
 * Slider Root
 */
const SliderBaseRoot = React.forwardRef<
    React.ElementRef<typeof SliderPrimitive.Root>,
    React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root>
>(({ className, ...props }, ref) => (
    <SliderPrimitive.Root
        ref={ref}
        className={cn(
            "relative flex w-full touch-none select-none items-center cursor-pointer",
            className
        )}
        {...props}
    />
));

SliderBaseRoot.displayName = SliderPrimitive.Root.displayName;

const SliderRoot = makeDecoratable("SliderRoot", SliderBaseRoot);

/**
 * Slider Track
 */
const SliderBaseTrack = () => (
    <SliderPrimitive.Track className="relative h-0.5 w-full grow overflow-hidden rounded-full bg-secondary">
        <SliderPrimitive.Range className="absolute h-full bg-primary data-[disabled]:opacity-50" />
    </SliderPrimitive.Track>
);

const SliderTrack = makeDecoratable("SliderTrack", SliderBaseTrack);

/**
 * Slider Tooltip
 */
const sliderTooltipVariants = cva(
    "bg-accent px-1.5 py-0.5 text-xs text-normal rounded absolute left-1/2 -translate-x-1/2",
    {
        variants: {
            side: {
                top: "bottom-8",
                bottom: "top-8"
            }
        },
        defaultVariants: {
            side: "bottom"
        }
    }
);

type SliderTooltipProps = VariantProps<typeof sliderTooltipVariants> & {
    value?: string;
    showTooltip?: boolean;
    tooltipSide?: "top" | "bottom";
};

const SliderBaseTooltip = ({ value, showTooltip, tooltipSide }: SliderTooltipProps) => {
    if (!value || !showTooltip) {
        return null;
    }

    return <div className={cn(sliderTooltipVariants({ side: tooltipSide }))}>{value}</div>;
};

const SliderTooltip = makeDecoratable("SliderTooltip", SliderBaseTooltip);

/**
 * Slider Thumb
 */
type SliderThumbProps = SliderTooltipProps;

const SliderBaseThumb = ({ value, showTooltip, tooltipSide }: SliderThumbProps) => (
    <SliderPrimitive.Thumb className="inline-block mt-1.5 h-4 w-4 rounded-full border-2 border-background bg-primary transition-colors outline-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50">
        <SliderTooltip showTooltip={showTooltip} value={value} tooltipSide={tooltipSide} />
    </SliderPrimitive.Thumb>
);

const SliderThumb = makeDecoratable("SliderThumb", SliderBaseThumb);

interface SliderProps
    extends Omit<
        SliderPrimitive.SliderProps,
        "defaultValue" | "value" | "onValueChange" | "onValueCommit"
    > {
    defaultValue?: number;
    onValueChange?(value: number): void;
    onValueCommit?(value: number): void;
    showTooltip?: boolean;
    tooltipSide?: "top" | "bottom";
    transformValue?: (value: number) => string;
    value?: number;
}

const SliderBase = ({
    defaultValue,
    onValueChange,
    onValueCommit,
    showTooltip,
    tooltipSide,
    transformValue,
    value,
    ...props
}: SliderProps) => {
    // Initialize the local value with defaultValue or the provided value
    const [localValue, setLocalValue] = React.useState(defaultValue || value);

    // Manage local state to determine whether to show the tooltip or not
    const [showTooltipValue, setShowTooltipValue] = React.useState(false);

    // Handle changes to the slider value
    const handleValueChange = React.useCallback(
        (newValue: number[]) => {
            // Show tooltip if 'showTooltip' prop is true
            setShowTooltipValue(() => !!showTooltip);
            // Update local value with the new value (the only in the array)
            setLocalValue(newValue[0]);
            // Trigger the optional 'onValueChange' callback with the new value
            onValueChange?.(newValue[0]);
        },
        [onValueChange, showTooltip]
    );

    // Handle when the value is committed (e.g., on drag end)
    const handleValueCommit = React.useCallback(
        (newValue: number[]) => {
            // Hide the tooltip when value commit happens
            setShowTooltipValue(false);
            // Trigger the optional 'onValueCommit' callback with the committed value
            onValueCommit?.(newValue[0]);
        },
        [onValueCommit]
    );

    // Optionally transform the value using the 'transformValue' function
    const handleValueTransform = React.useCallback(
        (value?: number) => {
            // If no value is provided, return early
            if (!value) {
                return;
            }

            // If 'transformValue' is not provided, return the value as a string
            if (!transformValue) {
                return String(value);
            }

            // Use 'transformValue' to transform the value and return it
            return transformValue(value);
        },
        [transformValue]
    );

    return (
        <SliderRoot
            {...props}
            value={value !== undefined ? [value] : undefined}
            defaultValue={defaultValue !== undefined ? [defaultValue] : undefined}
            onValueChange={handleValueChange}
            onValueCommit={handleValueCommit}
        >
            <SliderTrack />
            <SliderThumb
                value={handleValueTransform(localValue)}
                tooltipSide={tooltipSide}
                showTooltip={showTooltipValue}
            />
        </SliderRoot>
    );
};

SliderBase.displayName = SliderPrimitive.Root.displayName;

const Slider = makeDecoratable("Slider", SliderBase);

export { Slider, type SliderProps, SliderRoot, SliderTrack, SliderThumb };
