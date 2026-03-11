import type { CSSProperties } from "react";
import React from "react";
import type { DroppableProps, OnDropCallable } from "./../Droppable.js";
import { Droppable } from "./../Droppable.js";
import { cn, cva } from "@webiny/admin-ui";

const droppableContainerVariants = cva(
    "bg-transparent box-border h-full min-h-[120px] relative user-select-none w-full border-md border-dashed",
    {
        variants: {
            isOver: {
                true: "border-accent-default text-accent-primary",
                false: "border-success-default text-success-primary"
            },
            isDroppable: {
                false: "border-success-default text-accent-primary"
            }
        },
        defaultVariants: {
            isOver: false,
            isDroppable: true
        }
    }
);

interface CenterProps {
    type?: string;
    onDrop: OnDropCallable;
    children: React.ReactNode;
    active?: boolean;
    highlight?: boolean;
    style?: CSSProperties;
    isDroppable?: DroppableProps["isDroppable"];
}

const getInert = (isDroppable: boolean) => {
    return isDroppable ? {} : { inert: true };
};

const Center = ({ onDrop, children, style, isDroppable }: CenterProps) => {
    return (
        <Droppable onDrop={onDrop} isDroppable={isDroppable}>
            {({ isOver, drop, isDroppable }) => (
                <div
                    ref={element => {
                        drop(element);
                    }}
                    style={{ width: "100%", height: "100%", ...style }}
                    data-testid={"cms-editor-first-field-area"}
                    {...getInert(isDroppable)}
                >
                    <div className={cn(droppableContainerVariants({ isOver, isDroppable }))}>
                        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 m-0">
                            {children}
                        </div>
                    </div>
                </div>
            )}
        </Droppable>
    );
};

export default Center;
