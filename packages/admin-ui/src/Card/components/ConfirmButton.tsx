import * as React from "react";
import { makeDecoratable } from "~/utils.js";
import type { ButtonProps } from "~/Button/index.js";
import { Button } from "~/Button/index.js";

const ConfirmButtonBase = (props: ButtonProps) => (
    <Button text={"Confirm"} {...props} variant="primary" />
);

export const ConfirmButton = makeDecoratable("ConfirmButton", ConfirmButtonBase);
