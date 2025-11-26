import * as React from "react";
import { cva } from "~/utils.js";
import { useWidgetProps } from "./WidgetPropsProvider.js";
import { WidgetActionsProvider } from "./WidgetActionsContext.js";

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
    const { footerStartActions, footerEndActions, padding } = useWidgetProps();

    if (!footerStartActions && !footerEndActions) {
        return <div className={emptyWidgetFooterVariants({ padding })} />;
    }

    return (
        <div className={widgetFooterVariants({ padding })}>
            {footerStartActions && (
                <WidgetActionsProvider location="footer-start">
                    <div className={"flex gap-x-sm"}>{footerStartActions}</div>
                </WidgetActionsProvider>
            )}
            {footerEndActions && (
                <WidgetActionsProvider location="footer-end">
                    <div className={"flex gap-x-sm ml-auto"}>{footerEndActions}</div>
                </WidgetActionsProvider>
            )}
        </div>
    );
};
