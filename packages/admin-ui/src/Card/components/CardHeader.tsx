import * as React from "react";
import { cn, cva } from "~/utils.js";
import { type CardProps } from "../Card.js";
import { CardTitle } from "./CardTitle.js";
import { ActionsAreaProvider } from "~/Card/components/ActionsAreaProvider.tsx";
import { CardDescription } from "./CardDescription.js";

const cardHeaderVariants = cva("wby-text-neutral-primary", {
    variants: {
        size: {
            sm: "wby-pt-md wby-pb-md-extra wby-px-md-extra wby-mr-xl",
            md: "wby-pt-md wby-pb-md-extra wby-px-md-extra wby-mr-xl",
            lg: "wby-pt-md wby-pb-md-extra wby-px-lg wby-mr-xl"
        }
    },
    defaultVariants: {
        size: "md"
    }
});

export type CardHeaderProps = Omit<React.HTMLAttributes<HTMLDivElement>, "title"> &
    Pick<CardProps, "title" | "icon" | "description" | "size"> & {
        actions?: React.ReactNode;
    };

export const CardHeader = ({
    actions,
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
            <div className={"wby-flex wby-justify-between"}>
                <div className="wby-mb-sm wby-text-sm wby-text-neutral-strong">
                    <CardTitle size={size}>
                        {icon &&
                            React.cloneElement(icon, {
                                size: size && ["lg", "xl", "full"].includes(size) ? "lg" : "md" // Adjust icon size based on card size
                            })}
                        {title}
                    </CardTitle>
                    {description && <CardDescription>{description}</CardDescription>}
                </div>
                <div>
                    <ActionsAreaProvider areaName={"header"}>{actions}</ActionsAreaProvider>
                </div>
            </div>
        </div>
    );
};
