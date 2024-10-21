import * as React from "react";
import * as SliderPrimitive from "@radix-ui/react-slider";
import { makeDecoratable } from "@webiny/react-composition";
import { cva, VariantProps } from "class-variance-authority";

import { Label } from "~/Label";
import { cn } from "~/utils";

/**
 * Slider Root
 */
const SliderBaseRoot = React.forwardRef<
    React.ElementRef<typeof SliderPrimitive.Root>,
    React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root>
>(({ className, ...props }, ref) => (
    <SliderPrimitive.Root
        ref={ref}
        className={cn("relative flex w-full touch-none select-none items-center", className)}
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
 * Slider Thumb
 */
const SliderBaseThumb = () => (
    <SliderPrimitive.Thumb className="block h-4 w-4 rounded-full border-2 border-background bg-primary ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 data-[disabled]:pointer-events-none data-[disabled]:opacity-50" />
);

const SliderThumb = makeDecoratable("SliderThumb", SliderBaseThumb);

/**
 * Slider Value
 */
interface SliderValueProps extends React.HTMLAttributes<HTMLSpanElement> {
    value: number;
}

const SliderBaseValue = (props: SliderValueProps) => (
    <span className={"font-light text-sm leading-none"}>{props.value}</span>
);

const SliderValue = makeDecoratable("SliderValue", SliderBaseValue);

/**
 * Slider
 */
const sliderVariants = cva("w-full", {
    variants: {
        labelPosition: {
            top: "",
            side: "flex"
        }
    },
    defaultVariants: {
        labelPosition: "top"
    }
});

interface SliderProps
    extends Omit<SliderPrimitive.SliderProps, "defaultValue" | "value">,
        VariantProps<typeof sliderVariants> {
    label?: React.ReactNode;
    defaultValue?: number;
    value?: number;
}

const SliderBase = ({
    label,
    defaultValue: originalDefaultValue,
    value: originalValue,
    onValueChange,
    labelPosition,
    className,
    ...props
}: SliderProps) => {
    const defaultValue = originalDefaultValue ? [originalDefaultValue] : undefined;
    const value = originalValue ? [originalValue] : undefined;
    const initialValue = defaultValue || value || [0];

    const [localValue, setLocalValue] = React.useState(initialValue);

    const handleValueChange = React.useCallback(
        (newValue: number[]) => {
            setLocalValue(newValue);
            if (onValueChange) {
                onValueChange(newValue);
            }
        },
        [onValueChange]
    );

    return (
        <div className={cn(sliderVariants({ labelPosition }), className)}>
            {label && <Label text={label} weight={"light"} className={""} />}
            <SliderRoot
                {...props}
                value={localValue}
                defaultValue={defaultValue}
                onValueChange={handleValueChange}
            >
                <SliderTrack />
                <SliderThumb />
            </SliderRoot>
            {label && <SliderValue value={localValue[0]} />}
        </div>
    );
};

SliderBase.displayName = SliderPrimitive.Root.displayName;

const Slider = makeDecoratable("Slider", SliderBase);

export { Slider, SliderRoot, SliderTrack, SliderThumb };
