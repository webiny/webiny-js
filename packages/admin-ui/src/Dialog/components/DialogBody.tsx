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

export type DialogBodyProps = Pick<DialogProps, "children" | "bodyPadding" | "size">;

export const DialogBody = ({ bodyPadding, size, children }: DialogBodyProps) => {
    return (
        <ScrollArea className="flex-auto min-h-0 h-[500px]">
            <div className={cn(dialogBodyVariants({ size, bodyPadding }))}>{children}</div>
        </ScrollArea>
    );
};
