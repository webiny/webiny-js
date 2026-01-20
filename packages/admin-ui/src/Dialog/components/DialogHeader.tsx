import * as React from "react";
import { cn, cva } from "~/utils.js";
import { type DialogProps } from "../Dialog.js";
import { DialogTitle } from "./DialogTitle.js";
import { DialogDescription } from "./DialogDescription.js";

const dialogHeaderVariants = cva(["flex flex-col gap-xs", "text-neutral-primary", "sm:text-left"], {
    variants: {
        size: {
            sm: "pt-md pb-md-extra px-md-extra mr-xl",
            md: "pt-md pb-md-extra px-md-extra mr-xl",
            lg: "pt-md pb-md-extra px-lg mr-xl",
            xl: "pt-md pb-md-extra px-lg mr-xl",
            full: "pt-md pb-md-extra px-lg mr-xl"
        }
    },
    defaultVariants: {
        size: "md"
    }
});

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
