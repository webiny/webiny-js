import * as React from "react";
import { makeDecoratable } from "~/utils.js";
import type { ButtonProps } from "~/Button/index.js";
import { Button } from "~/Button/index.js";

const ConfirmActionBase = (props: ButtonProps) => (
    <Button {...props} variant="primary" />
);

export const ConfirmAction = makeDecoratable("ConfirmAction", ConfirmActionBase);
