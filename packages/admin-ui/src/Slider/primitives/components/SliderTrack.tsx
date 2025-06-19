import * as React from "react";
import { Slider as SliderPrimitives } from "radix-ui";
import { cn } from "~/utils";

const SliderTrack = () => (
    <SliderPrimitives.Track
        className={cn(
            "wby-relative wby-h-xxs wby-w-full wby-grow wby-overflow-hidden wby-rounded-full",
            "wby-bg-neutral-strong",
            "data-[disabled]:wby-bg-neutral-muted"
        )}
    >
        <SliderPrimitives.Range
            className={cn([
                "wby-absolute wby-h-full",
                "wby-bg-primary-default",
                "data-[disabled]:wby-bg-primary-disabled"
            ])}
        />
    </SliderPrimitives.Track>
);

export { SliderTrack };
