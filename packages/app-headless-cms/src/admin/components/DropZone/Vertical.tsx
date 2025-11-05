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
            "absolute top-0 h-full w-[30%] z-10 bg-transparent",
            last ? "text-right -right-sm" : "text-left -left-sm"
        )}
    >
        <div
            className={cn(
                "absolute w-md h-full z-3 border-dashed border-sm hidden",
                isOver ? "border-accent-default" : "border-success-default",
                last ? "-right-sm" : "-left-sm",
                isDragging && "block"
            )}
        >
            <div
                className={cn(
                    "w-full h-full opacity-50",
                    isOver ? "bg-primary-muted" : "bg-success-muted"
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
