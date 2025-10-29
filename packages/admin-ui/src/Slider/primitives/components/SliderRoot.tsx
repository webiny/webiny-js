import * as React from "react";
import { Slider as SliderPrimitives } from "radix-ui";
import { cn } from "~/utils.js";

const SliderRoot = ({ className, ...props }: SliderPrimitives.SliderProps) => (
    <SliderPrimitives.Root
        className={cn(
            [
                "relative flex w-full touch-none select-none items-center cursor-pointer",
                "data-disabled:cursor-not-allowed"
            ],
            className
        )}
        {...props}
    />
);

export { SliderRoot };
