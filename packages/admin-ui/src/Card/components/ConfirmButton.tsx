import * as React from "react";
import { makeDecoratable } from "~/utils.js";
import { Button, ButtonProps } from "~/Button/index.js";
import { useActionsAreaProvider } from "./ActionsAreaProvider";

const ConfirmButtonBase = (props: ButtonProps) => {
    const { areaName } = useActionsAreaProvider();
    const buttonSize = areaName === "header" ? "sm" : "md";
    return <Button text={"Confirm"} {...props} variant="primary" size={buttonSize} />;
};
export const ConfirmButton = makeDecoratable("ConfirmButton", ConfirmButtonBase);
