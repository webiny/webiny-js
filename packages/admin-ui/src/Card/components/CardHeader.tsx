import * as React from "react";
import { cn, cva } from "~/utils.js";
import { CardTitle } from "./CardTitle.js";
import { CardDescription } from "./CardDescription.js";
import { useCardProps } from "./CardPropsProvider.js";

const cardHeaderVariants = cva("text-neutral-primary", {
    variants: {
        padding: {
            sm: "pt-sm-extra pl-md pr-sm-plus",
            md: "pt-md pl-lg pr-md",
            lg: "pt-lg pl-xl pr-lg"
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

export const CardHeader = () => {
    const {
        actionsPosition,
        actions,
        title,
        icon,
        description,
        padding,
        variant,
        size,
        className
    } = useCardProps();

    const nothingToRender = React.useMemo(() => {
        return !title && !description && !icon;
    }, [title, description, icon]);

    if (nothingToRender) {
        return null;
    }

    return (
        <div className={cn(cardHeaderVariants({ padding, variant }), className)}>
            <div className={"flex justify-between"}>
                <div className="flex flex-col gap-xs mb-sm text-sm text-neutral-strong pb-md">
                    <CardTitle padding={padding} size={size} variant={variant}>
                        {icon}
                        {title}
                    </CardTitle>
                    {description && <CardDescription>{description}</CardDescription>}
                </div>
                {actions && actionsPosition === "header" && (
                    <div className={"flex gap-sm"}>{actions}</div>
                )}
            </div>
        </div>
    );
};
