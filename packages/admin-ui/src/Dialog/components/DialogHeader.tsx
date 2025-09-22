import * as React from "react";
import { cn, cva } from "~/utils.js";
import { type DialogProps } from "../Dialog.js";
import { DialogTitle } from "./DialogTitle.js";
import { DialogDescription } from "./DialogDescription.js";

const dialogHeaderVariants = cva(
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

export type DialogHeaderProps = Omit<React.HTMLAttributes<HTMLDivElement>, "title"> &
    Pick<DialogProps, "title" | "icon" | "description" | "size">;

export const DialogHeader = ({
    title,
    icon,
    description,
    size,
    className,
    ...props
}: DialogHeaderProps) => {
    const nothingToRender = React.useMemo(() => {
        return !title && !description && !icon;
    }, [title, description, icon]);

    if (nothingToRender) {
        return null;
    }

    return (
        <div {...props} className={cn(dialogHeaderVariants({ size }), className)}>
            <DialogTitle size={size}>
                {icon &&
                    React.cloneElement(icon, {
                        size: size && ["lg", "xl", "full"].includes(size) ? "lg" : "md" // Adjust icon size based on dialog size
                    })}
                {title}
            </DialogTitle>
            {description && <DialogDescription>{description}</DialogDescription>}
        </div>
    );
};
