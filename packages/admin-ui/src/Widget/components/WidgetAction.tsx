import * as React from "react";
import { makeDecoratable } from "~/utils.js";
import { Button, ButtonProps } from "~/Button/index.js";
import { useWidgetActionsLocation } from "./WidgetActionsContext.js";

const WidgetActionBase = (props: ButtonProps) => {
    const location = useWidgetActionsLocation();

    // Apply different props based on location
    const locationProps: Partial<ButtonProps> = React.useMemo(() => {
        if (location === "header") {
            return {
                size: "md",
                variant: props.variant || "ghost"
            };
        }
        if (location === "footer-start") {
            return {
                size: "md",
                variant: props.variant || "primary"
            };
        }
        if (location === "footer-end") {
            return {
                size: "md",
                variant: props.variant || "ghost"
            };
        }
        // Default fallback
        return {
            size: "md"
        };
    }, [location, props.variant]);

    return <Button {...locationProps} {...props} />;
};

export const WidgetAction = makeDecoratable("WidgetAction", WidgetActionBase);
