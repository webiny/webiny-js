import React from "react";
import { cn, makeDecoratable } from "~/utils";

interface ItemContentProps extends React.HTMLAttributes<HTMLDivElement> {}

const BaseItemContent = ({ children, className, ...props }: ItemContentProps) => {
    return (
        <div className={cn("wby-flex wby-items-center wby-w-full", className)} {...props}>
            {children}
        </div>
    );
};

const ItemContent = makeDecoratable("TreeItemContent", BaseItemContent);

export { ItemContent, type ItemContentProps };
