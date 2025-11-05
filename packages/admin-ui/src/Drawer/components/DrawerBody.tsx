import * as React from "react";
import { cn } from "~/utils.js";
import type { DrawerProps } from "~/Drawer/index.js";

export type DrawerBodyProps = Pick<DrawerProps, "children" | "bodyPadding">;

export const DrawerBody = ({ bodyPadding, children }: DrawerBodyProps) => {
    return (
        <div
            className={cn("h-full overflow-auto", {
                "px-lg": bodyPadding !== false
            })}
        >
            {children}
        </div>
    );
};
