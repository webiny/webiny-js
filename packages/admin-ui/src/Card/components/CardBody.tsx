import * as React from "react";
import { cn, cva } from "~/utils.js";
import type { CardProps } from "~/Card/index.js";

const cardBodyVariants = cva("wby-flex-1", {
    variants: {
        size: {
            sm: "wby-px-md-extra",
            md: "wby-px-md-extra",
            lg: "wby-px-lg",
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
