import React from "react";
import type { IsVisibleCallable } from "../Droppable.js";
import { Droppable } from "../Droppable.js";
import type { DragSource } from "~/types.js";
import { cn, Icon } from "@webiny/admin-ui";
import { ReactComponent as AddIcon } from "@webiny/icons/add.svg";

interface VerticalProps {
    depth?: number;
    onDrop(item: DragSource): void;
    last?: boolean;
    isVisible?: IsVisibleCallable;
}

const Vertical = ({ depth, last, onDrop, isVisible }: VerticalProps) => {
    return (
        <Droppable onDrop={onDrop} isVisible={isVisible}>
            {({ isOver, isDragging, drop }) => (
                <div
                    ref={element => {
                        drop(element);
                    }}
                    className={cn("w-sm-extra h-full absolute top-0", last ? "right-0" : "left-0")}
                    style={{ zIndex: isDragging ? 1000 + (depth || 0) : -1 }}
                >
                    {isDragging && (
                        <div
                            className={cn(
                                "absolute top-0 h-full flex items-center rounded-xs",
                                last ? "right-0" : "left-0"
                            )}
                        >
                            <div
                                className={cn(
                                    "h-full w-sm-extra rounded-xs p-xxs transition-colors relative flex items-center justify-center",
                                    isOver ? "bg-warning-muted" : "bg-warning-muted/60"
                                )}
                            >
                                <Icon
                                    icon={<AddIcon />}
                                    label="Add"
                                    size="xs"
                                    className={"fill-warning-600"}
                                />
                            </div>
                        </div>
                    )}
                </div>
            )}
        </Droppable>
    );
};

export default Vertical;
