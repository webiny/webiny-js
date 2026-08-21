import React from "react";
import { cn } from "~/utils.js";

/*
    The design-system `Link` is an anchor and needs a destination, so these actions are buttons
    wearing its type ramp and colours: `text-accent-primary` for the primary action,
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

interface ItemTextActionsProps extends React.HTMLAttributes<HTMLDivElement> {
    onRemoveItem?: () => void;
    onEditItem?: () => void;
    onReplaceItem?: () => void;
    disabled?: boolean;
}

/**
 * The file actions as text rather than icon buttons. Icons cost a fixed ~52px of a row and say
 * little at that size; spelled out on their own line they cost only the height they occupy,
 * which is what a narrow panel has to spare.
 */
const ItemTextActions = ({
    className,
    disabled,
    onEditItem,
    onRemoveItem,
    onReplaceItem,
    ...props
}: ItemTextActionsProps) => {
    return (
        <div {...props} className={cn("flex items-center gap-sm-extra", className)}>
            {onReplaceItem && (
                <TextAction onClick={onReplaceItem} disabled={disabled} accent>
                    Replace
                </TextAction>
            )}
            {onEditItem && (
                <TextAction onClick={onEditItem} disabled={disabled}>
                    Edit
                </TextAction>
            )}
            {onRemoveItem && (
                <TextAction onClick={onRemoveItem} disabled={disabled}>
                    Remove
                </TextAction>
            )}
        </div>
    );
};

export { ItemTextActions, type ItemTextActionsProps };
