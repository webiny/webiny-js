import React from "react";
import { Icon } from "~/Icon/index.js";
import { linkVariants } from "~/Link/index.js";
import { cn } from "~/utils.js";

/*
    An action that is not navigation cannot be a `Link` - the design-system one is an anchor and
    needs a destination - so it is a button wearing `Link`'s variants. Borrowing them rather than
    restating them keeps the type ramp, colors and focus ring in one place; only the button reset
    and the disabled state below are this component's own.
*/
/*
    TODO: fold this into the design system as `Button variant="link"` - a button that looks like a
    link is a general need, not a file-picker one. Left out of the patch release because it is not
    a one-line variant: `buttonVariants` carries `no-underline!` in its base, every `size` re-adds
    the padding, border and radius a link variant has to strip, and the size x contentLayout
    compounds re-add padding for icon layouts. Retiring this component afterwards is a one-file
    change - it already renders the same classes.
*/
const buttonReset = "inline-flex items-center gap-xs cursor-pointer bg-transparent border-none p-0";
const disabledClassName =
    "disabled:cursor-not-allowed disabled:text-neutral-disabled disabled:no-underline";

interface TextActionProps {
    onClick: () => void;
    disabled?: boolean;
    accent?: boolean;
    /**
     * Drawn before the label. `fill-current` below makes it follow the label's color, so it picks
     * up the accent and the disabled state without being told about either.
     */
    icon?: React.ReactNode;
    children: React.ReactNode;
}

const TextAction = ({ onClick, disabled, accent, icon, children }: TextActionProps) => (
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
        {icon ? <Icon icon={icon} label={""} size={"sm"} className={"fill-current"} /> : null}
        {children}
    </button>
);

export { TextAction, type TextActionProps };
