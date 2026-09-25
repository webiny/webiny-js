import * as React from "react";
import { Command as CommandPrimitive } from "cmdk";
import { cn } from "~/utils.js";
import { ScrollArea } from "~/ScrollArea/index.js";

type ListProps = React.ComponentPropsWithoutRef<typeof CommandPrimitive.List>;

const List = ({ className, style, onScroll, ...props }: ListProps) => {
    /*
     * The list scrolls inside a `ScrollArea`, whose scrollbar is an element rather than the
     * operating system's own, so it can keep focus on the input while it is dragged. Layout and
     * scroll props go to the scroll area, since that is the element that scrolls now. The thumb
     * shows whenever the list is longer than its box, as in a Select, so a long list doesn't look
     * like it ends where it's cut off.
     */
    return (
        <ScrollArea
            type={"auto"}
            className={cn("w-full bg-neutral-base", className)}
            style={style}
            viewportClassName={"max-h-96 overflow-x-hidden"}
            onViewportScroll={onScroll}
        >
            <CommandPrimitive.List
                className={"block w-full py-sm text-neutral-strong"}
                {...props}
            />
        </ScrollArea>
    );
};

export { List, type ListProps };
