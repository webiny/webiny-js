import React from "react";
import type { IsVisibleCallable } from "../Droppable.js";
import { Droppable } from "../Droppable.js";
import type { DragSource } from "~/types.js";
import { Icon } from "@webiny/admin-ui";
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
                    style={{
                        height: "12px",
                        width: "100%",
                        position: "absolute",
                        [last ? "bottom" : "top"]: -12,
                        left: 0,
                        zIndex: isDragging ? 1000 : -1
                    }}
                >
                    {isDragging && (
                        <div
                            className={
                                "absolute w-full flex items-center " + (last ? "bottom-0" : "top-0")
                            }
                        >
                            <div
                                className={
                                    "w-full h-sm-extra rounded-xs p-xxs transition-colors relative flex items-center justify-center " +
                                    (isOver ? "bg-primary" : "bg-[#fdc5b4]")
                                }
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
