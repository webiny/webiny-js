import React from "react";
import { ReactComponent as XIcon } from "@webiny/icons/close.svg";
import { IconButton } from "~/Button/index.js";
import { DialogClose } from "./DialogClose.js";

type CloseDialogIconButtonProps = {
    size: "sm" | "md" | "lg" | "xl" | "full" | null | undefined;
};

export const CloseDialogIconButton = ({ size }: CloseDialogIconButtonProps) => {
    const buttonSize = React.useMemo(() => {
        return size && ["lg", "xl", "full"].includes(size) ? "md" : "sm";
    }, [size]);

    return (
        <div className={"absolute top-md right-md"}>
            <DialogClose asChild>
                <IconButton size={buttonSize} iconSize="lg" variant={"ghost"} icon={<XIcon />} />
            </DialogClose>
        </div>
    );
};
