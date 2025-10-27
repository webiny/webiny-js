import * as React from "react";
import { cn, cva } from "~/utils.js";
import { useCardProps } from "./CardProvider.js";
import type { CardProps } from "~/Card/index.js";

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

export type CardFooterProps = React.HTMLAttributes<HTMLDivElement> &
    Pick<CardProps, "padding" | "info" | "actions" | "actionsPosition">;

export const CardFooter = ({ actions, info, className, padding, ...props }: CardFooterProps) => {
    const { actionsPosition } = useCardProps();

    if (!actions && !info) {
        return null;
    }

    return (
        <div {...props} className={cn(cardFooterVariants({ padding }), className)}>
            {info && (
                <div className={"text-sm flex items-center"}>
                    <div>{info}</div>
                </div>
            )}
            {actions && actionsPosition === "footer" && (
                <div className={"flex gap-x-sm ml-auto"}>{actions}</div>
            )}
        </div>
    );
};
