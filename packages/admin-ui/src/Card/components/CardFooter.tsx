import * as React from "react";
import { cva } from "~/utils.js";
import { useCardProps } from "./CardPropsProvider.js";

const cardFooterVariants = cva("flex justify-between", {
    variants: {
        padding: {
            sm: "p-md",
            md: "py-md-extra px-lg",
            lg: "pt-lg pb-xl px-xl"
        }
    },
    defaultVariants: {
        padding: "md"
    }
});

const emptyCardFooterVariants = cva("", {
    variants: {
        padding: {
            sm: "h-lg",
            md: "h-lg",
            lg: "h-xl"
        }
    },
    defaultVariants: {
        padding: "md"
    }
});

export const CardFooter = () => {
    const { actionsPosition, actions, info, padding } = useCardProps();

    if (!actions && !info) {
        return <div className={emptyCardFooterVariants({ padding })} />;
    }

    return (
        <div className={cardFooterVariants({ padding })}>
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
