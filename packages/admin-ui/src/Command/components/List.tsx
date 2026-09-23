import * as React from "react";
import { Command as CommandPrimitive } from "cmdk";
import { cn } from "~/utils.js";
import { ScrollArea } from "~/ScrollArea/index.js";

type ListProps = React.ComponentPropsWithoutRef<typeof CommandPrimitive.List>;

const List = ({ className, style, ...props }: ListProps) => {
    return (
        // The list scrolls inside a `ScrollArea` so that it gets the same thumb as the rest of the
        // admin. Scrolling it natively would show the operating system's own scrollbar. Layout
        // props go to the scroll area, since that is the element the list now lives in.
        <ScrollArea
            className={cn("w-full bg-neutral-base", className)}
            style={style}
            viewportClassName={"max-h-96 overflow-x-hidden"}
        >
            <CommandPrimitive.List
                className={"block w-full py-sm text-neutral-strong"}
                {...props}
            />
        </ScrollArea>
    );
};

export { List, type ListProps };
