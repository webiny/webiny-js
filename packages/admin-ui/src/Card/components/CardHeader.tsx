import * as React from "react";
import { cn, cva } from "~/utils.js";
import { type CardProps } from "../Card.js";
import { CardTitle } from "./CardTitle.js";
import { CardDescription } from "./CardDescription.js";
import { useCardProps } from "./CardProvider.js";

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

export type CardHeaderProps = Omit<React.HTMLAttributes<HTMLDivElement>, "title"> &
    Pick<
        CardProps,
        | "actions"
        | "actionsPosition"
        | "description"
        | "icon"
        | "padding"
        | "size"
        | "title"
        | "variant"
    >;

export const CardHeader = ({
    actions,
    title,
    icon,
    description,
    padding,
    variant,
    size,
    className,
    ...props
}: CardHeaderProps) => {
    const nothingToRender = React.useMemo(() => {
        return !title && !description && !icon;
    }, [title, description, icon]);

    const { actionsPosition } = useCardProps();

    if (nothingToRender) {
        return null;
    }

    return (
        <div {...props} className={cn(cardHeaderVariants({ padding, variant }), className)}>
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
