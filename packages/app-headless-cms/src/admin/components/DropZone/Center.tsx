import type { CSSProperties } from "react";
import React from "react";
import type { DroppableProps, OnDropCallable } from "./../Droppable.js";
import { Droppable } from "./../Droppable.js";
import { cn, cva } from "@webiny/admin-ui";

const droppableContainerVariants = cva(
    "wby-bg-transparent wby-box-border wby-h-full wby-min-h-[120px] wby-relative wby-user-select-none wby-w-full wby-border-md wby-border-dashed",
    {
        variants: {
            isOver: {
                true: "wby-border-accent-default wby-text-accent-primary",
                false: "wby-border-success-default wby-text-success-primary"
            },
            isDroppable: {
                false: "wby-border-success-default wby-text-accent-primary"
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
    return isDroppable ? {} : { inert: "" };
};

const Center = ({ onDrop, children, style, isDroppable }: CenterProps) => {
    return (
        <Droppable onDrop={onDrop} isDroppable={isDroppable}>
            {({ isOver, drop, isDroppable }) => (
                <div
                    ref={drop}
                    style={{ width: "100%", height: "100%", ...style }}
                    data-testid={"cms-editor-first-field-area"}
                    {...getInert(isDroppable)}
                >
                    <div className={cn(droppableContainerVariants({ isOver, isDroppable }))}>
                        <div className="wby-absolute wby-top-1/2 wby-left-1/2 wby-transform wby--translate-x-1/2 wby--translate-y-1/2 wby-m-0">
                            {children}
                        </div>
                    </div>
                </div>
            )}
        </Droppable>
    );
};

export default Center;
