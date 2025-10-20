import React from "react";
import { ReactComponent as ReplaceIcon } from "@webiny/icons/file_upload.svg";
import { ReactComponent as EditIcon } from "@webiny/icons/edit.svg";
import { ReactComponent as TrashIcon } from "@webiny/icons/delete.svg";
import { IconButton } from "~/Button/index.js";
import { Icon } from "~/Icon/index.js";
import { cn } from "~/utils.js";

interface ItemActionsProps extends React.HTMLAttributes<HTMLDivElement> {
    onRemoveItem?: () => void;
    onEditItem?: () => void;
    onReplaceItem?: () => void;
    disabled?: boolean;
    small?: boolean;
}

const ItemActions = ({
    disabled,
    onRemoveItem,
    onEditItem,
    onReplaceItem,
    small,
    className,
    ...props
}: ItemActionsProps) => {
    const iconSize = small ? "default" : "lg";
    const buttonSize = small ? "xs" : "sm";

    return (
        <div
            {...props}
            className={cn("flex justify-center items-center gap-xs", className)}
        >
            {small && onReplaceItem && (
                <IconButton
                    icon={
                        <Icon
                            icon={<ReplaceIcon />}
                            label={"Replace"}
                            size={"md"}
                            color={"neutral-light"}
                        />
                    }
                    variant={"ghost"}
                    size={buttonSize}
                    iconSize={iconSize}
                    onClick={onReplaceItem}
                    disabled={disabled}
                />
            )}

            {onEditItem && (
                <IconButton
                    icon={
                        <Icon
                            icon={<EditIcon />}
                            label={"Edit"}
                            size={"md"}
                            color={"neutral-light"}
                        />
                    }
                    variant={"ghost"}
                    size={buttonSize}
                    iconSize={iconSize}
                    onClick={onEditItem}
                    disabled={disabled}
                />
            )}

            {onRemoveItem && (
                <IconButton
                    icon={
                        <Icon
                            icon={<TrashIcon />}
                            label={"Remove"}
                            size={"md"}
                            color={"neutral-light"}
                        />
                    }
                    variant={"ghost"}
                    size={buttonSize}
                    iconSize={iconSize}
                    onClick={onRemoveItem}
                    disabled={disabled}
                />
            )}
        </div>
    );
};

export { ItemActions, type ItemActionsProps };
