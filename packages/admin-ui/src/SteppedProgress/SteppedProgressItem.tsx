import React from "react";
import { cn, makeDecoratable } from "~/utils.js";
import { type ProgressItemFormatted } from "./domains/index.js";
import {
    SteppedProgressIcon,
    SteppedProgressIndicator,
    SteppedProgressLabel
} from "./components/index.js";

type SteppedProgressItemProps = React.HTMLAttributes<HTMLDivElement> & ProgressItemFormatted;

const DecoratableSteppedProgressItem = ({
    label,
    state,
    errored,
    disabled,
    className,
    ...props
}: SteppedProgressItemProps) => {
    return (
        <div
            {...props}
            className={cn(
                "flex justify-start items-center gap-sm-extra py-sm",
                className
            )}
        >
            <SteppedProgressIndicator state={state} errored={errored} disabled={disabled}>
                <SteppedProgressIcon state={state} errored={errored} disabled={disabled} />
            </SteppedProgressIndicator>
            <SteppedProgressLabel state={state} disabled={disabled} label={label} />
        </div>
    );
};

const SteppedProgressItem = makeDecoratable("SteppedProgressItem", DecoratableSteppedProgressItem);

export { SteppedProgressItem, type SteppedProgressItemProps };
