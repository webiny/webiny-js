import * as React from "react";
import { cn } from "~/utils.js";
import { Separator } from "~/Separator/index.js";
import type { DrawerProps } from "~/Drawer/index.js";

export interface DrawerFooterProps extends React.HTMLAttributes<HTMLDivElement> {
    actions?: React.ReactNode;
    info?: React.ReactNode;
    separator?: DrawerProps["footerSeparator"];
}

export const DrawerFooter = ({
    actions,
    info,
    className,
    separator,
    ...props
}: DrawerFooterProps) => {
    if (!actions && !info) {
        return null;
    }

    return (
        <>
            {separator && <Separator />}
            <div {...props} className={cn("flex justify-between p-lg pt-md-extra", className)}>
                {info && (
                    <div className={"text-sm flex items-center"}>
                        <div>{info}</div>
                    </div>
                )}
                {actions && <div className={"flex gap-x-sm ml-auto"}>{actions}</div>}
            </div>
        </>
    );
};
