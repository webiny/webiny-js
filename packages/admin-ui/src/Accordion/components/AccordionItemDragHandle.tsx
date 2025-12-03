import * as React from "react";
import { ReactComponent as DragHandleIcon } from "@webiny/icons/drag_indicator.svg";
import { Icon } from "~/Icon/index.js";
import { IconButton, type IconButtonProps } from "~/Button/index.js";
import { cn } from "~/utils.js";

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
                    "absolute top-1/2 -left-sm -translate-y-sm",
                    "invisible group-hover/trigger:visible"
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
                className={"cursor-grab"}
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
