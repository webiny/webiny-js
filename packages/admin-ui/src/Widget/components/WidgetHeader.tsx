import * as React from "react";
import { cn, cva } from "~/utils.js";
import { WidgetTitle } from "./WidgetTitle.js";
import { WidgetDescription } from "./WidgetDescription.js";
import { useWidgetProps } from "./WidgetPropsProvider.js";

const widgetHeaderVariants = cva("text-neutral-primary", {
    variants: {
        padding: {
            sm: "pt-sm-extra pl-md pr-sm-extra",
            md: "pt-md pl-lg pr-md"
        },
        variant: {
            default: "",
            accent: "bg-primary-subtle"
        }
    },
    defaultVariants: {
        padding: "md",
        variant: "default"
    }
});

export const WidgetHeader = () => {
    const {
        actionsPosition,
        actions,
        title,
        icon,
        description,
        padding,
        variant,
        className
    } = useWidgetProps();

    const nothingToRender = React.useMemo(() => {
        return !title && !description && !icon;
    }, [title, description, icon]);

    if (nothingToRender) {
        return null;
    }

    return (
        <div className={cn(widgetHeaderVariants({ padding, variant }), className)}>
            <div className={"flex justify-between"}>
                <div className="flex flex-col gap-xs mb-sm text-sm text-neutral-strong pb-md">
                    <WidgetTitle padding={padding} variant={variant}>
                        {icon}
                        {title}
                    </WidgetTitle>
                    {description && <WidgetDescription>{description}</WidgetDescription>}
                </div>
                {actions && actionsPosition === "header" && (
                    <div className={"flex gap-sm"}>{actions}</div>
                )}
            </div>
        </div>
    );
};

