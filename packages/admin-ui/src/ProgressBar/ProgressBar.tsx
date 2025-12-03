import * as React from "react";
import {
    ProgressIndicator,
    ProgressRoot,
    type ProgressRootProps,
    ProgressValue
} from "./components/index.js";
import { useProgressBar } from "./useProgressBar.js";
import { cn, makeDecoratable } from "~/utils.js";

interface ProgressBarProps extends ProgressRootProps {
    valuePosition?: "start" | "end" | "both";
}

const DecoratableProgressBar = ({ valuePosition, className, ...props }: ProgressBarProps) => {
    const { vm } = useProgressBar(props);

    return (
        <div className={cn("w-full flex items-center gap-sm py-xs", className)}>
            {valuePosition && valuePosition !== "end" && (
                <ProgressValue value={valuePosition === "start" ? vm.textValue : vm.textMin} />
            )}
            <ProgressRoot {...props}>
                <ProgressIndicator value={vm.value} />
            </ProgressRoot>
            {valuePosition && valuePosition !== "start" && <ProgressValue value={vm.textValue} />}
        </div>
    );
};

const ProgressBar = makeDecoratable("ProgressBar", DecoratableProgressBar);

export { ProgressBar, type ProgressBarProps };
