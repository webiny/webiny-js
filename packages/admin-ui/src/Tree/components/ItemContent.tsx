import React from "react";
import { cn, makeDecoratable } from "~/utils.js";

export type ItemContentProps = React.HTMLAttributes<HTMLDivElement>;

const BaseItemContent = ({ children, className, ...props }: ItemContentProps) => {
    return (
        <div className={cn("flex items-center w-full gap-x-sm truncate", className)} {...props}>
            {children}
        </div>
    );
};

export const ItemContent = makeDecoratable("TreeItemContent", BaseItemContent);
