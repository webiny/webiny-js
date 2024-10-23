import * as React from "react";
import * as SliderPrimitive from "@radix-ui/react-slider";
import { makeDecoratable } from "@webiny/react-composition";
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
 * Slider Thumb
 */
const SliderBaseThumb = () => (
    <SliderPrimitive.Thumb className="block h-4 w-4 rounded-full border-2 border-background bg-primary ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 data-[disabled]:pointer-events-none data-[disabled]:opacity-50" />
);

const SliderThumb = makeDecoratable("SliderThumb", SliderBaseThumb);

interface SliderProps
    extends Omit<
        SliderPrimitive.SliderProps,
        "defaultValue" | "value" | "onValueChange" | "onValueCommit"
    > {
    value?: number;
    defaultValue?: number;
    onValueChange?(value: number): void;
    onValueCommit?(value: number): void;
}

const SliderBase = ({
    value,
    defaultValue,
    onValueChange,
    onValueCommit,
    ...props
}: SliderProps) => {
    const handleValueChange = React.useCallback(
        (newValue: number[]) => {
            onValueChange?.(newValue[0]);
        },
        [onValueChange]
    );

    const handleValueCommit = React.useCallback(
        (newValue: number[]) => {
            onValueCommit?.(newValue[0]);
        },
        [onValueCommit]
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
            <SliderThumb />
        </SliderRoot>
    );
};

SliderBase.displayName = SliderPrimitive.Root.displayName;

const Slider = makeDecoratable("Slider", SliderBase);

export { Slider, type SliderProps, SliderRoot, SliderTrack, SliderThumb };
