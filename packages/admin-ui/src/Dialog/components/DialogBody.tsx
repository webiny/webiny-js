import * as React from "react";
import { cn, cva } from "~/utils.js";
import type { DialogProps } from "~/Dialog/index.js";

const dialogBodyVariants = cva("flex-1", {
    // Flex grows to fill available space - we need this for the body to expand in case of a "fullscreen" dialog
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
    return <div className={cn(dialogBodyVariants({ size, bodyPadding }))}>{children}</div>;
};
