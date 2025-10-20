import React from "react";
import { cn, makeDecoratable } from "~/utils.js";

const DecoratableToastActions = ({
    children,
    className,
    ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
    <div
        {...props}
        className={cn(
            "flex w-full items-center justify-start gap-sm mt-md",
            className
        )}
    >
        {children}
    </div>
);

const ToastActions = makeDecoratable("ToastActions", DecoratableToastActions);

export { ToastActions };
