import React from "react";
import { useDrop } from "react-dnd";
import deepEqual from "deep-equal";
import { cn, Icon } from "@webiny/admin-ui";
import { ReactComponent as InsertIcon } from "@webiny/icons/add_circle.svg";
import { ReactComponent as BlockIcon } from "@webiny/icons/block.svg";
import type { Box } from "~/BaseEditor/defaultConfig/Content/Preview/Box.js";
import type { DropEvent } from "~/BaseEditor/defaultConfig/Content/Preview/useProximityDropzone.js";
import { useIsDragging } from "~/BaseEditor/defaultConfig/Content/Preview/useIsDragging.js";

interface DropBoxProps {
    box: Box;
    onDrop: (event: DropEvent) => void;
}

export const DropBox = React.memo(
    ({ box, onDrop }: DropBoxProps) => {
        const isDragging = useIsDragging();

        const [{ isOver, item }, dropRef] = useDrop<
            any,
            unknown,
            { item: { name: string; id?: string }; isOver: boolean }
        >(() => ({
            accept: "ELEMENT",
            drop: item => {
                // Prevent dropping the element into itself!
                if (item?.id === box.parentId) {
                    return;
                }

                onDrop({
                    item,
                    target: { parentId: box.parentId, index: 0, slot: box.parentSlot }
                });
            },
            collect: monitor => ({
                item: monitor.getItem(),
                isOver: monitor.isOver()
            })
        }));

        const canAccept = isDragging && item?.id !== box.parentId;
        const disabled = "border-neutral-muted fill-neutral-disabled";
        const enabled = "border-success-default fill-success";
        const mouseOver = "border-accent-default fill-accent-default";

        const classes = cn(
            "flex absolute items-center justify-center border-sm border-dashed",
            canAccept && isOver && mouseOver,
            canAccept && !isOver && enabled,
            !canAccept && disabled
        );

        return dropRef(
            <div
                data-role={"element-slot"}
                data-slot-id={box.id}
                data-depth={box.depth}
                className={classes}
                style={{
                    zIndex: 100 + box.depth,
                    top: box.top,
                    left: box.left,
                    width: box.width,
                    height: box.height,
                    pointerEvents: canAccept ? "auto" : "none"
                }}
            >
                <Icon
                    icon={isDragging && !canAccept ? <BlockIcon /> : <InsertIcon />}
                    label={"Add Element"}
                />
            </div>
        );
    },
    (prev, next) => deepEqual(prev, next)
);

DropBox.displayName = "DropBox";
