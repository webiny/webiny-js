import * as React from "react";
import { cn, cva } from "~/utils.js";
import type { CardProps } from "~/Card/index.js";

const cardBodyVariants = cva("wby-flex-1", {
    // Flex grows to fill available space - we need this for the body to expand in case of a "fullscreen" card
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

export type CardBodyProps = Pick<CardProps, "children" | "bodyPadding" | "size">;

export const CardBody = ({ bodyPadding, size, children }: CardBodyProps) => {
    return <div className={cn(cardBodyVariants({ size, bodyPadding }))}>{children}</div>;
};
