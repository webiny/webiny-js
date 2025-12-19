import * as React from "react";
import { makeDecoratable } from "~/utils.js";
import { DialogClose } from "./DialogClose.js";
import type { ButtonProps } from "~/Button/index.js";
import { Button } from "~/Button/index.js";

const CancelButtonBase = (props: ButtonProps) => (
    <DialogClose asChild>
        <Button text={"Cancel"} {...props} variant="secondary" />
    </DialogClose>
);

export const CancelButton = makeDecoratable("CancelButton", CancelButtonBase);
