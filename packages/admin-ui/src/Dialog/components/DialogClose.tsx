import React from "react";
import { Dialog as DialogPrimitive } from "radix-ui";
import { ReactComponent as XIcon } from "@webiny/icons/close.svg";
import { IconButton } from "~/Button";

export const DialogClosePrimitive = DialogPrimitive.Close;

type DialogCloseProps = {
    size: "sm" | "md" | "lg" | "xl" | "full" | null | undefined;
};

export const DialogClose = ({ size }: DialogCloseProps) => {
    const buttonSize = React.useMemo(() => {
        return size && ["lg", "xl", "full"].includes(size) ? "md" : "sm";
    }, [size]);

    return (
        <div className={"wby-absolute wby-top-md wby-right-md"}>
            <DialogPrimitive.Close asChild>
                <IconButton size={buttonSize} iconSize="lg" variant={"ghost"} icon={<XIcon />} />
            </DialogPrimitive.Close>
        </div>
    );
};
