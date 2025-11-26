import * as React from "react";
import { cn } from "~/utils.js";
import { cva } from "~/utils.js";
import { useWidgetProps } from "./WidgetPropsProvider.js";

const widgetBodyVariants = cva("flex-1", {
    variants: {
        padding: {
            none: "",
            sm: "px-md",
            md: "px-lg"
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

export const WidgetBody = () => {
    const { padding, bodyPadding, children } = useWidgetProps();
    return (
        <div
            data-widget="body"
            className={cn(
                widgetBodyVariants({
                    padding: bodyPadding !== false ? padding : "none"
                })
            )}
        >
            {children}
        </div>
    );
};
