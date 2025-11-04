import React from "react";
import { cn, makeDecoratable } from "~/utils.js";
import { Text } from "~/Text/index.js";

type DescriptionProps = Omit<React.HTMLAttributes<HTMLDivElement>, "children"> & {
    text: React.ReactNode;
};

const DecoratableToastDescription = ({ text, className, ...props }: DescriptionProps) => (
    <div
        {...props}
        className={cn(
            "mt-xs-plus group-[.default-variant]:text-neutral-dimmed group-[.subtle-variant]:text-neutral-strong",
            className
        )}
    >
        <Text as={"div"} size={"md"} className={"text-neutral-dimmed"}>
            {text}
        </Text>
    </div>
);

const ToastDescription = makeDecoratable("ToastDescription", DecoratableToastDescription);

export { ToastDescription, type DescriptionProps };
