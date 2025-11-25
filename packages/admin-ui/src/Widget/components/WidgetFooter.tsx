import * as React from "react";
import { cva } from "~/utils.js";
import { useWidgetProps } from "./WidgetPropsProvider.js";

const widgetFooterVariants = cva("flex justify-between", {
    variants: {
        padding: {
            sm: "p-md",
            md: "py-md-extra px-lg"
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
            md: "h-lg"
        }
    },
    defaultVariants: {
        padding: "md"
    }
});

export const WidgetFooter = () => {
    const { footerLeftActions, footerRightActions, padding } = useWidgetProps();

    if (!footerLeftActions && !footerRightActions) {
        return <div className={emptyWidgetFooterVariants({ padding })} />;
    }

    return (
        <div className={widgetFooterVariants({ padding })}>
            {footerLeftActions && (
                <div className={"flex gap-x-sm"}>
                    {footerLeftActions}
                </div>
            )}
            {footerRightActions && (
                <div className={"flex gap-x-sm ml-auto"}>{footerRightActions}</div>
            )}
        </div>
    );
};

