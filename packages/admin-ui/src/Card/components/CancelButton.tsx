import * as React from "react";
import { makeDecoratable } from "~/utils.js";
import type { ButtonProps } from "~/Button/index.js";
import { Button } from "~/Button/index.js";

const CancelButtonBase = (props: ButtonProps) => (
    <Button text={"Cancel"} {...props} variant="secondary" />
);

export const CancelButton = makeDecoratable("CancelButton", CancelButtonBase);
