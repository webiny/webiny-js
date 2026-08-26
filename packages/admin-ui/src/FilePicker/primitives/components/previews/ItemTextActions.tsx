import React from "react";
import { cn } from "~/utils.js";
import { TextAction } from "./TextAction.js";

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
