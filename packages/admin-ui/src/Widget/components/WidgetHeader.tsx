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
        }
    },
    defaultVariants: {
        padding: "md"
    }
});

export const WidgetHeader = () => {
    const { headerActions, title, icon, description, padding, className } = useWidgetProps();

    const nothingToRender = React.useMemo(() => {
        return !title && !description && !icon;
    }, [title, description, icon]);

    if (nothingToRender) {
        return null;
    }

    return (
        <div data-widget="header" className={cn(widgetHeaderVariants({ padding }), className)}>
            <div className={"flex justify-between"}>
                <div className="flex flex-col gap-xs text-sm text-neutral-strong pb-sm-extra">
                    <WidgetTitle>
                        {icon}
                        {title}
                    </WidgetTitle>
                    {description && <WidgetDescription>{description}</WidgetDescription>}
                </div>
                {headerActions && <div className={"flex gap-sm"}>{headerActions}</div>}
            </div>
        </div>
    );
};
