import * as React from "react";
import { cn, cva } from "~/utils.js";
import { useCardProps } from "./CardPropsProvider.js";

const cardFooterVariants = cva("flex justify-between", {
    variants: {
        padding: {
            sm: "p-md-extra",
            md: "p-md-extra",
            lg: "p-lg"
        }
    },
    defaultVariants: {
        padding: "md"
    }
});

export const CardFooter = () => {
    const { actionsPosition, actions, info, className, padding } = useCardProps();

    if (!actions && !info) {
        return null;
    }

    return (
        <div className={cn(cardFooterVariants({ padding }), className)}>
            {info && (
                <div className={"text-sm flex items-center"}>
                    <div>{info}</div>
                </div>
            )}
            {actions && actionsPosition !== "header" && (
                <div className={"flex gap-x-sm ml-auto"}>{actions}</div>
            )}
        </div>
    );
};
