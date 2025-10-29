import React from "react";
import { cn, makeDecoratable } from "~/utils.js";
import { Heading } from "~/Heading/index.js";

type ToastTitleProps = Omit<React.HTMLAttributes<HTMLDivElement>, "children"> & {
    text: React.ReactNode;
};

const DecoratableToastTitle = ({ text, className, ...props }: ToastTitleProps) => (
    <div
        {...props}
        className={cn(
            "group-[.default-variant]:text-neutral-light group-[.subtle-variant]:text-neutral-primary font-normal group-[.has-description]:font-semibold",
            className
        )}
    >
        <Heading level={6}>{text}</Heading>
    </div>
);

const ToastTitle = makeDecoratable("ToastTitle", DecoratableToastTitle);

export { ToastTitle, type ToastTitleProps };
