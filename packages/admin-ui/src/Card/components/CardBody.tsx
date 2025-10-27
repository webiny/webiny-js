import * as React from "react";
import { cn } from "~/utils.js";
import { cva } from "~/utils.js";
import type { CardProps } from "~/Card/index.js";

const cardBodyVariants = cva("flex-1", {
    variants: {
        padding: {
            sm: "px-md",
            md: "px-lg",
            lg: "px-xl"
        }
    },
    defaultVariants: {
        padding: "md"
    }
});

export type CardBodyProps = Pick<CardProps, "children" | "padding">;

export const CardBody = ({ padding, children }: CardBodyProps) => {
    return (
        <div data-card="body" className={cn(cardBodyVariants({ padding }))}>
            {children}
        </div>
    );
};
