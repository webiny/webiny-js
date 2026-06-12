import type { DragEventHandler } from "react";
import React from "react";
import { Icon } from "@webiny/admin-ui";

interface GridItemProps {
    testId: string;
    label: string;
    icon: React.ReactElement;
    onDragStart: DragEventHandler;
    dragRef: (element: HTMLElement | null) => void;
}

const GridItem = ({ testId, label, icon, onDragStart, dragRef }: GridItemProps) => {
    return (
        <div
            ref={dragRef}
            data-testid={testId}
            onDragStart={onDragStart}
            className={
                "flex flex-col items-center justify-center gap-[8px] size-20 bg-neutral-subtle rounded-md cursor-grab shrink-0"
            }
        >
            <Icon icon={icon} label={label} size={"lg"} color={"neutral-strong"} />
            <span
                className={
                    "text-xs font-normal text-neutral-strong text-center leading-4 overflow-hidden text-ellipsis whitespace-nowrap w-full px-[8px]"
                }
            >
                {label}
            </span>
        </div>
    );
};

export { GridItem, type GridItemProps };
