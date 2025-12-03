import React from "react";
import { cn, cva, HeaderBar, IconButton, type VariantProps } from "@webiny/admin-ui";
import { ReactComponent as CloseIcon } from "@webiny/icons/close.svg";

const overlayHeaderVariants = cva("", {
    variants: {
        variant: {
            default: "bg-neutral-base text-neutral-base",
            strong: "bg-neutral-dark text-neutral-light"
        }
    },
    defaultVariants: {
        variant: "default"
    }
});

interface OverlayHeaderProps
    extends React.HTMLAttributes<HTMLDivElement>,
        VariantProps<typeof overlayHeaderVariants> {
    start?: React.ReactNode;
    middle?: React.ReactNode;
    end?: React.ReactNode;
    hideOverlay?: () => void;
}

const OverlayHeader = ({
    start,
    middle,
    end,
    hideOverlay,
    variant,
    className,
    ...props
}: OverlayHeaderProps) => {
    const buttonIconVariant = variant === "strong" ? "ghost-negative" : "ghost";

    return (
        <HeaderBar
            start={<div className={"pl-md"}>{start}</div>}
            middle={middle}
            end={
                <>
                    {end}
                    <IconButton
                        variant={buttonIconVariant}
                        size={"md"}
                        iconSize={"lg"}
                        onClick={hideOverlay}
                        icon={<CloseIcon />}
                    />
                </>
            }
            className={cn(overlayHeaderVariants({ variant }), className)}
            {...props}
        />
    );
};

export { OverlayHeader, type OverlayHeaderProps, overlayHeaderVariants };
