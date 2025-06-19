import React from "react";
import { Dialog as DialogPrimitive } from "radix-ui";
import { ReactComponent as XIcon } from "@webiny/icons/close.svg";
import { IconButton } from "~/Button";

export const DialogClosePrimitive = DialogPrimitive.Close;

export const DialogClose = () => {
    return (
        <div className={"wby-absolute wby-top-md wby-right-md"}>
            <DialogPrimitive.Close asChild>
                <IconButton size="md" iconSize="lg" variant={"ghost"} icon={<XIcon />} />
            </DialogPrimitive.Close>
        </div>
    );
};
