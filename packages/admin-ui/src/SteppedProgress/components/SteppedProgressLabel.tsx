import React from "react";
import { Text } from "~/Text/index.js";
import { cn } from "~/utils.js";
import { ProgressItemState } from "~/SteppedProgress/domains/index.js";

interface SteppedProgressLabelProps extends React.HTMLAttributes<HTMLSpanElement> {
    label: string;
    state: ProgressItemState;
    disabled: boolean;
}

const SteppedProgressLabel = ({
    label,
    state,
    disabled,
    className,
    ...props
}: SteppedProgressLabelProps) => {
    return (
        <Text
            {...props}
            className={cn(
                state === ProgressItemState.IN_PROGRESS ? "font-semibold" : "font-regular",
                disabled ? "text-neutral-disabled" : "text-neutral-primary",
                className
            )}
        >
            {label}
        </Text>
    );
};

export { SteppedProgressLabel, type SteppedProgressLabelProps };
