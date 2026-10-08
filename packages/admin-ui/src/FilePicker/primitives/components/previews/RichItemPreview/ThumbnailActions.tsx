import React, { useCallback } from "react";
import { ReactComponent as ReplaceIcon } from "@webiny/icons/file_upload.svg";
import { ReactComponent as EditIcon } from "@webiny/icons/edit.svg";
import { ReactComponent as TrashIcon } from "@webiny/icons/delete.svg";
import { IconButton } from "~/Button/index.js";
import { Tooltip } from "~/Tooltip/index.js";
import { cn } from "~/utils.js";

interface ActionProps {
    icon: React.JSX.Element;
    label: string;
    onAction: () => void;
    disabled?: boolean;
}

const Action = ({ icon, label, onAction, disabled }: ActionProps) => {
    const onClick = useCallback(
        (event: React.MouseEvent<HTMLButtonElement>) => {
            event.stopPropagation();
            onAction();
        },
        [onAction]
    );

    return (
        <Tooltip
            content={label}
            trigger={
                <IconButton
                    variant={"tertiary"}
                    size={"sm"}
                    icon={icon}
                    onClick={onClick}
                    disabled={disabled}
                />
            }
        />
    );
};

interface ThumbnailActionsProps {
    onRemoveItem?: () => void;
    onEditItem?: () => void;
    onReplaceItem?: () => void;
    disabled?: boolean;
    className?: string;
}

const ThumbnailActions = ({
    className,
    disabled,
    onEditItem,
    onRemoveItem,
    onReplaceItem
}: ThumbnailActionsProps) => {
    return (
        <div
            className={cn(
                "invisible group-hover:visible",
                "flex items-center gap-xxs",
                "absolute top-xs-plus right-xs-plus",
                className
            )}
        >
            {onReplaceItem && (
                <Action
                    icon={<ReplaceIcon />}
                    label={"Replace"}
                    onAction={onReplaceItem}
                    disabled={disabled}
                />
            )}
            {onEditItem && (
                <Action
                    icon={<EditIcon />}
                    label={"Edit"}
                    onAction={onEditItem}
                    disabled={disabled}
                />
            )}
            {onRemoveItem && (
                <Action
                    icon={<TrashIcon />}
                    label={"Remove"}
                    onAction={onRemoveItem}
                    disabled={disabled}
                />
            )}
        </div>
    );
};

export { ThumbnailActions, type ThumbnailActionsProps };
