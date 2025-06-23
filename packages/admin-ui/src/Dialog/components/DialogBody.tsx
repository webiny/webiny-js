import * as React from "react";
import { cn, cva } from "~/utils";
import type { DialogProps } from "~/Dialog";

const dialogBodyVariants = cva("wby-flex-1", {
    // Flex grows to fill available space - we need this for the body to expand in case of a "fullscreen" dialog
    variants: {
        size: {
            sm: "wby-px-md-extra",
            md: "wby-px-md-extra",
            lg: "wby-px-lg",
            xl: "wby-px-lg",
            full: "wby-px-lg"
        },
        bodyPadding: {
            true: "",
            false: "!wby-px-none"
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
