import React from "react";
import { cn } from "@webiny/admin-ui";

interface OverlayBackdropProps extends React.HTMLAttributes<HTMLDivElement> {
    visible?: boolean;
    hideOverlay: () => void;
}

const OverlayBackdrop = ({ hideOverlay, visible }: OverlayBackdropProps) => {
    return (
        <div
            onClick={hideOverlay}
            data-state={visible ? "open" : "closed"}
            className={cn(
                "fixed inset-0 bg-neutral-dark/50",
                "transition ease-in-out",
                "data-[state=open]:animate-in data-[state=open]:fade-in data-[state=open]:duration-500",
                "data-[state=closed]:animate-out data-[state=closed]:fade-out data-[state=closed]:duration-150"
            )}
        />
    );
};

export { OverlayBackdrop, type OverlayBackdropProps };
