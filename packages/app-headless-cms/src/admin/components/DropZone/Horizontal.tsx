import React from "react";
import type { IsVisibleCallable } from "../Droppable.js";
import { Droppable } from "../Droppable.js";
import type { DragSource } from "~/types.js";
import { cn } from "@webiny/admin-ui";

interface OuterDivProps {
    isOver: boolean;
    isDragging: boolean;
    last: boolean;
}

const OuterDiv = ({ isOver, isDragging, last }: OuterDivProps) => (
    <div
        className={cn(
            "absolute w-full z-10 bg-transparent flex justify-center",
            last ? "-bottom-md" : "-top-md"
        )}
    >
        <div
            className={cn(
                "h-md w-full z-3 border-dashed border-sm hidden",
                isOver ? "border-accent-default" : "border-success-default",
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
                        /* For dropzone debugging: border: "1px solid blue",*/
                        height: "16px",
                        width: "100%",
                        position: "absolute",
                        [last ? "bottom" : "top"]: 0,
                        left: 0,
                        zIndex: isDragging ? 1000 : -1
                    }}
                >
                    <OuterDiv isOver={isOver} isDragging={isDragging} last={last ?? false} />
                </div>
            )}
        </Droppable>
    );
};

export default Horizontal;
