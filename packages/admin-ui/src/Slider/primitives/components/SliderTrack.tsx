import * as React from "react";
import { Slider as SliderPrimitives } from "radix-ui";
import { cn } from "~/utils.js";

const SliderTrack = () => (
    <SliderPrimitives.Track
        className={cn(
            "relative h-xxs w-full grow overflow-hidden rounded-full",
            "bg-neutral-strong",
            "data-disabled:bg-neutral-muted"
        )}
    >
        <SliderPrimitives.Range
            className={cn(["absolute h-full", "bg-primary", "data-disabled:bg-primary-disabled"])}
        />
    </SliderPrimitives.Track>
);

export { SliderTrack };
