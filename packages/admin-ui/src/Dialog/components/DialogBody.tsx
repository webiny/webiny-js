import * as React from "react";
import { cn, cva } from "~/utils.js";
import type { DialogProps } from "~/Dialog/index.js";
import { ScrollArea } from "~/ScrollArea/index.js";

const dialogBodyVariants = cva("", {
    variants: {
        size: {
            sm: "px-md-extra",
            md: "px-md-extra",
            lg: "px-lg",
            xl: "px-lg",
            full: "px-lg"
        },
        bodyPadding: {
            true: "",
            false: "px-none! py-none!"
        }
    },
    defaultVariants: {
        size: "md",
        bodyPadding: true
    }
});

export type DialogBodyProps = Pick<DialogProps, "children" | "bodyPadding" | "scrollable" | "size">;

export const DialogBody = ({ bodyPadding, scrollable = true, size, children }: DialogBodyProps) => {
    const content = <div className={cn(dialogBodyVariants({ size, bodyPadding }))}>{children}</div>;

    if (!scrollable) {
        return content;
    }

    return <ScrollArea className="h-full">{content}</ScrollArea>;
};
