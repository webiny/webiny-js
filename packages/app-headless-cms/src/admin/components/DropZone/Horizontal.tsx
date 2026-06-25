import React from "react";
import type { IsVisibleCallable } from "../Droppable.js";
import { Droppable } from "../Droppable.js";
import type { DragSource } from "~/types.js";
import { cn, Icon } from "@webiny/admin-ui";
import { ReactComponent as AddIcon } from "@webiny/icons/add.svg";

interface HorizontalProps {
    onDrop(item: DragSource): void;
    last?: boolean;
    isVisible?: IsVisibleCallable;
    ["data-testid"]?: string;
}

const Horizontal = ({ last, onDrop, isVisible, ...rest }: HorizontalProps) => {
    return (
        <Droppable onDrop={onDrop} isVisible={isVisible}>
            {({ isOver, isDragging, drop }) => (
                <div
                    ref={element => {
                        drop(element);
                    }}
                    data-testid={rest["data-testid"]}
                    className={cn(
                        "h-sm-extra w-full absolute left-0",
                        last ? "-bottom-sm-extra" : "-top-sm-extra",
                        isDragging ? "z-[1000]" : "-z-[1]"
                    )}
                >
                    {isDragging && (
                        <div
                            className={cn(
                                "absolute bg-primary w-full flex items-center rounded-xs",
                                last ? "bottom-0" : "top-0"
                            )}
                        >
                            <div
                                className={cn(
                                    "w-full h-sm-extra rounded-xs p-xxs transition-colors relative flex items-center justify-center",
                                    isOver ? "bg-primary-light/60" : "bg-primary-light"
                                )}
                            >
                                <Icon icon={<AddIcon />} label="Add" size="xs" color="accent" />
                            </div>
                        </div>
                    )}
                </div>
            )}
        </Droppable>
    );
};

export default Horizontal;
