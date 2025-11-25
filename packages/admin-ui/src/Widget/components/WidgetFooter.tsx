import * as React from "react";
import { cva } from "~/utils.js";
import { useWidgetProps } from "./WidgetPropsProvider.js";

const widgetFooterVariants = cva("flex justify-between", {
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

const emptyWidgetFooterVariants = cva("", {
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

export const WidgetFooter = () => {
    const { actionsPosition, actions, info, padding } = useWidgetProps();

    if (!actions && !info) {
        return <div className={emptyWidgetFooterVariants({ padding })} />;
    }

    return (
        <div className={widgetFooterVariants({ padding })}>
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

