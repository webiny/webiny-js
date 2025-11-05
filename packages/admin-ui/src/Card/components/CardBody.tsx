import * as React from "react";
import { cn } from "~/utils.js";
import { cva } from "~/utils.js";
import { useCardProps } from "./CardPropsProvider.js";

const cardBodyVariants = cva("flex-1", {
    variants: {
        padding: {
            sm: "px-md",
            md: "px-lg",
            lg: "px-xl"
        },
        variant: {
            default: "",
            accent: "pt-lg pb-sm"
        }
    },
    defaultVariants: {
        padding: "md"
    }
});

export const CardBody = () => {
    const { padding, variant, children } = useCardProps();
    return (
        <div data-card="body" className={cn(cardBodyVariants({ padding, variant }))}>
            {children}
        </div>
    );
};
