import React from "react";
import { linkVariants } from "~/Link/index.js";
import { cn } from "~/utils.js";

/*
    An action that is not navigation cannot be a `Link` - the design-system one is an anchor and
    needs a destination - so it is a button wearing `Link`'s variants. Borrowing them rather than
    restating them keeps the type ramp, colors and focus ring in one place; only the button reset
    and the disabled state below are this component's own.
*/
const buttonReset = "cursor-pointer bg-transparent border-none p-0";
const disabledClassName =
    "disabled:cursor-not-allowed disabled:text-neutral-disabled disabled:no-underline";

interface TextActionProps {
    onClick: () => void;
    disabled?: boolean;
    accent?: boolean;
    children: React.ReactNode;
}

const TextAction = ({ onClick, disabled, accent, children }: TextActionProps) => (
    <button
        type={"button"}
        onClick={onClick}
        disabled={disabled}
        className={cn(
            linkVariants({ size: "sm", variant: accent ? "primary" : "secondary" }),
            buttonReset,
            disabledClassName
        )}
    >
        {children}
    </button>
);

export { TextAction, type TextActionProps };
