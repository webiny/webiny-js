import * as React from "react";
import { cn, cva } from "~/utils.js";
import { type CardProps } from "../Card.js";
import { CardTitle } from "./CardTitle.js";
import { CardDescription } from "./CardDescription.js";

const cardHeaderVariants = cva(
    ["wby-flex wby-flex-col wby-gap-sm", "wby-text-neutral-primary", "wby-sm:text-left"],
    {
        variants: {
            size: {
                sm: "wby-pt-md wby-pb-md-extra wby-px-md-extra wby-mr-xl",
                md: "wby-pt-md wby-pb-md-extra wby-px-md-extra wby-mr-xl",
                lg: "wby-pt-md wby-pb-md-extra wby-px-lg wby-mr-xl",
                xl: "wby-pt-md wby-pb-md-extra wby-px-lg wby-mr-xl",
                full: "wby-pt-md wby-pb-md-extra wby-px-lg wby-mr-xl"
            }
        },
        defaultVariants: {
            size: "md"
        }
    }
);

export type CardHeaderProps = Omit<React.HTMLAttributes<HTMLDivElement>, "title"> &
    Pick<CardProps, "title" | "icon" | "description" | "size">;

export const CardHeader = ({
    title,
    icon,
    description,
    size,
    className,
    ...props
}: CardHeaderProps) => {
    const nothingToRender = React.useMemo(() => {
        return !title && !description && !icon;
    }, [title, description, icon]);

    if (nothingToRender) {
        return null;
    }

    return (
        <div {...props} className={cn(cardHeaderVariants({ size }), className)}>
            <CardTitle size={size}>
                {icon &&
                    React.cloneElement(icon, {
                        size: size && ["lg", "xl", "full"].includes(size) ? "lg" : "md" // Adjust icon size based on card size
                    })}
                {title}
            </CardTitle>
            {description && <CardDescription>{description}</CardDescription>}
        </div>
    );
};
