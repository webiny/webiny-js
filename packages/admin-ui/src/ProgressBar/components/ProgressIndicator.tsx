import React from "react";
import { Progress as ProgressPrimitive } from "radix-ui";

interface ProgressIndicatorProps {
    value?: number | null;
}

const ProgressIndicator = ({ value = 0 }: ProgressIndicatorProps) => {
    return (
        <ProgressPrimitive.Indicator
            data-slot="progress-indicator"
            className="wby-bg-primary-default wby-h-full wby-w-full wby-flex-1 wby-rounded-full wby-transition-all"
            style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
        />
    );
};

export { ProgressIndicator, type ProgressIndicatorProps };
