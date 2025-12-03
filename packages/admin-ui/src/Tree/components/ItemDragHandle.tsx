import type { RefObject } from "react";
import React from "react";
import { ReactComponent as DragIndicator } from "@webiny/icons/drag_indicator.svg";
import { IconButton } from "~/Button/index.js";
import { Icon } from "~/Icon/index.js";
import { cn, makeDecoratable } from "~/utils.js";

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
                    "absolute top-sm -left-sm",
                    "invisible group-hover:visible",
                    "size-md",
                    isDragging ? "cursor-grabbing" : "cursor-grab"
                ])}
            />
        </div>
    );
};

const ItemDragHandle = makeDecoratable("TreeItemDragHandle", BaseItemDragHandle);

export { ItemDragHandle, type ItemDragHandleProps };
