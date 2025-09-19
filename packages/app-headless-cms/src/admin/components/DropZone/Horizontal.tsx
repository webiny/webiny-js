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
            "wby-absolute wby-w-full wby-z-10 wby-bg-transparent wby-flex wby-justify-center",
            last ? "-wby-bottom-md" : "-wby-top-md"
        )}
    >
        <div
            className={cn(
                "wby-h-md wby-w-full wby-z-3 wby-border-dashed wby-border-sm wby-hidden",
                isOver ? "wby-border-accent-default" : "wby-border-success-default",
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
                    // @ts-expect-error
                    ref={drop}
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
