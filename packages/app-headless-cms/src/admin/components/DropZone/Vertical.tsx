import React from "react";
import type { IsVisibleCallable } from "../Droppable.js";
import { Droppable } from "../Droppable.js";
import type { DragSource } from "~/types.js";
import { cn } from "@webiny/admin-ui";

interface OuterDivVerticalProps {
    isOver: boolean;
    last?: boolean;
    isDragging?: boolean;
}

const OuterDivVertical = ({ isOver, last, isDragging }: OuterDivVerticalProps) => (
    <div
        className={cn(
            "wby-absolute wby-top-0 wby-h-full wby-w-[30%] wby-z-10 wby-bg-transparent",
            last ? "wby-text-right -wby-right-sm" : "wby-text-left -wby-left-sm"
        )}
    >
        <div
            className={cn(
                "wby-absolute wby-w-md wby-h-full wby-z-3 wby-border-dashed wby-border-sm wby-hidden",
                isOver ? "wby-border-accent-default" : "wby-border-success-default",
                last ? "-wby-right-sm" : "-wby-left-sm",
                isDragging && "wby-block"
            )}
        >
            <div
                className={cn(
                    "wby-w-full wby-h-full wby-opacity-50",
                    isOver ? "wby-bg-primary-muted" : "wby-bg-success-muted"
                )}
            />
        </div>
    </div>
);

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
                    ref={drop}
                    style={{
                        /* For dropzone debugging: border: "1px solid blue",*/
                        width: "30%",
                        maxWidth: "100px",
                        height: "100%",
                        position: "absolute",
                        top: 0,
                        [last ? "right" : "left"]: 0,
                        zIndex: isDragging ? 1000 + (depth || 0) : -1
                    }}
                >
                    <OuterDivVertical isOver={isOver} isDragging={isDragging} last={last} />
                </div>
            )}
        </Droppable>
    );
};

export default Vertical;
