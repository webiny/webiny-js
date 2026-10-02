import * as React from "react";
import { cn } from "~/utils.js";
import { type DrawerProps } from "../Drawer.js";
import { DrawerTitle } from "./DrawerTitle.js";
import { DrawerDescription } from "./DrawerDescription.js";
import { ReactComponent as XIcon } from "@webiny/icons/close.svg";
import { IconButton } from "~/Button/index.js";
import { Dialog as DrawerPrimitive } from "radix-ui";
import { useMemo } from "react";
import { Separator } from "~/Separator/index.js";

export type DrawerHeaderProps = Omit<React.HTMLAttributes<HTMLDivElement>, "title"> &
    Pick<DrawerProps, "title" | "icon" | "description" | "showCloseButton" | "headerActions"> & {
        separator?: DrawerProps["headerSeparator"];
    };

export const DrawerHeader = ({
    title,
    icon,
    description,
    showCloseButton,
    headerActions,
    separator,
    className,
    ...props
}: DrawerHeaderProps) => {
    const nothingToRender = useMemo(() => {
        return !title && !description && !icon && !showCloseButton && !headerActions;
    }, [title, description, icon, showCloseButton, headerActions]);

    if (nothingToRender) {
        return null;
    }

    return (
        <>
            <div
                {...props}
                className={cn(
                    "flex flex-col gap-sm px-lg py-md text-center sm:text-left text-neutral-primary",
                    className
                )}
            >
                <DrawerTitle className={"flex justify-between"}>
                    <div className={"flex items-center gap-xs"}>
                        {icon}
                        {title}
                    </div>

                    <div className={"flex items-center gap-xs"}>
                        {headerActions}
                        {showCloseButton !== false && (
                            <DrawerPrimitive.Close asChild>
                                <IconButton
                                    size="md"
                                    iconSize="lg"
                                    variant={"ghost"}
                                    icon={<XIcon />}
                                />
                            </DrawerPrimitive.Close>
                        )}
                    </div>
                </DrawerTitle>
                {description && <DrawerDescription>{description}</DrawerDescription>}
            </div>
            {separator && <Separator />}
        </>
    );
};
