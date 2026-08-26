import React from "react";
import { cn } from "~/utils.js";

/*
    The design-system `Link` is an anchor and needs a destination, so these actions are buttons
    wearing its type ramp and colors: `text-accent-primary` for the primary action,
    `text-neutral-primary` for the rest, underline on hover.
*/
const actionClassName = [
    "font-sans text-sm rounded-xs cursor-pointer bg-transparent border-none p-0",
    "hover:underline",
    "focus-visible:outline-none focus-visible:ring-[2px] focus-visible:ring-primary-dimmed",
    "disabled:cursor-not-allowed disabled:text-neutral-disabled disabled:no-underline"
];

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
        className={cn(actionClassName, accent ? "text-accent-primary" : "text-neutral-primary")}
    >
        {children}
    </button>
);

export { TextAction, type TextActionProps };
