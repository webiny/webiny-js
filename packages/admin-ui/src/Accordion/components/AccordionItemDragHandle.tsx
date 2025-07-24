import * as React from "react";
import { ReactComponent as DragHandleIcon } from "@webiny/icons/drag_indicator.svg";
import { Icon } from "~/Icon";
import { IconButton, type IconButtonProps } from "~/Button";
import { cn } from "~/utils";

interface AccordionItemDragHandleProps extends Omit<IconButtonProps, "icon"> {
    icon?: React.ReactElement;
    label?: string;
}

const AccordionItemDragHandle = ({
    onClick,
    className,
    ...props
}: AccordionItemDragHandleProps) => {
    // We need to stop the event propagation to prevent the accordion from opening/closing when the handle is clicked.
    const onClickCallback = React.useCallback(
        (e: React.MouseEvent<HTMLButtonElement>) => {
            e.stopPropagation();

            if (onClick) {
                onClick(e);
            }
        },
        [onClick]
    );

    return (
        <span
            className={cn(
                [
                    "wby-absolute wby-top-1/2 -wby-left-sm -wby-translate-y-sm",
                    "wby-invisible group-hover/trigger:wby-visible"
                ],
                className
            )}
        >
            <IconButton
                {...props}
                onClick={onClickCallback}
                size={"xs"}
                iconSize={"default"}
                variant={"secondary"}
                className={"wby-cursor-grab"}
                icon={
                    <Icon
                        size={"sm"}
                        color={"neutral-strong"}
                        icon={<DragHandleIcon />}
                        label={"Drag handle"}
                    />
                }
            />
        </span>
    );
};

export { AccordionItemDragHandle, type AccordionItemDragHandleProps };
