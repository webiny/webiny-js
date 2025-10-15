import * as React from "react";
import { cn, cva, type VariantProps } from "~/utils.js";
import { ActionsAreaProvider } from "./ActionsAreaProvider.js";

const cardFooterVariants = cva("wby-flex wby-justify-between", {
    variants: {
        size: {
            sm: "wby-p-md-extra",
            md: "wby-p-md-extra",
            lg: "wby-p-lg"
        }
    },
    defaultVariants: {
        size: "md"
    }
});

export interface CardFooterProps
    extends React.HTMLAttributes<HTMLDivElement>,
        VariantProps<typeof cardFooterVariants> {
    actions?: React.ReactNode;
    info?: React.ReactNode;
}

export const CardFooter = ({ actions, info, className, size, ...props }: CardFooterProps) => {
    if (!actions && !info) {
        return null;
    }

    return (
        <div {...props} className={cn(cardFooterVariants({ size }), className)}>
            {info && (
                <div className={"wby-text-sm wby-flex wby-items-center"}>
                    <div>{info}</div>
                </div>
            )}
            {actions && (
                <div className={"wby-flex wby-gap-x-sm wby-ml-auto"}>
                    <ActionsAreaProvider areaName={"footer"}>{actions}</ActionsAreaProvider>
                </div>
            )}
        </div>
    );
};
