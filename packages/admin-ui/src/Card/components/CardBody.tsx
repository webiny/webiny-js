import * as React from "react";
import { cn } from "~/utils.js";
import { cva } from "~/utils.js";
import { useCardProps } from "./CardPropsProvider.js";

const cardBodyVariants = cva("flex-1", {
    variants: {
        padding: {
            none: "",
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
    const { padding, variant, bodyPadding, children } = useCardProps();
    return (
        <div
            data-card="body"
            className={cn(
                cardBodyVariants({
                    padding: bodyPadding !== false ? padding : "none",

                    variant
                })
            )}
        >
            {children}
        </div>
    );
};
