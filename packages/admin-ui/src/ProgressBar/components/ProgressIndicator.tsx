import React from "react";
import { Progress as ProgressPrimitive } from "radix-ui";

interface ProgressIndicatorProps {
    value?: number | null;
}

const ProgressIndicator = ({ value = 0 }: ProgressIndicatorProps) => {
    return (
        <ProgressPrimitive.Indicator
            data-slot="progress-indicator"
            className="bg-primary h-full w-full flex-1 rounded-full transition-all"
            style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
        />
    );
};

export { ProgressIndicator, type ProgressIndicatorProps };
