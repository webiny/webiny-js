import React, { RefObject } from "react";
import { ReactComponent as DragIndicator } from "@webiny/icons/drag_indicator.svg";
import { IconButton } from "~/Button";
import { Icon } from "~/Icon";
import { cn, makeDecoratable } from "~/utils";

type ItemDragHandleProps = {
    handleRef?: RefObject<HTMLDivElement | null>;
};

const BaseItemDragHandle = ({ handleRef }: ItemDragHandleProps) => {
    const [isDragging, setIsDragging] = React.useState(false);

    return (
        <div ref={handleRef as React.LegacyRef<HTMLDivElement>}>
            <IconButton
                size={"xs"}
                variant={"secondary"}
                icon={<Icon icon={<DragIndicator />} size="sm" label={"Drag to reorder"} />}
                onMouseDown={() => setIsDragging(true)}
                onMouseUp={() => setIsDragging(false)}
                onMouseLeave={() => setIsDragging(false)}
                className={cn([
                    "wby-absolute wby-top-sm -wby-left-sm",
                    "wby-invisible group-hover:wby-visible",
                    "wby-size-md",
                    isDragging ? "wby-cursor-grabbing" : "wby-cursor-grab"
                ])}
            />
        </div>
    );
};

const ItemDragHandle = makeDecoratable("TreeItemDragHandle", BaseItemDragHandle);

export { ItemDragHandle, type ItemDragHandleProps };
