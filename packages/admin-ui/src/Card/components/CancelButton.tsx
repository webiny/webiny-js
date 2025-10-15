import * as React from "react";
import { makeDecoratable } from "~/utils.js";
import { Button, ButtonProps } from "~/Button/index.js";
import { useActionsAreaProvider } from "./ActionsAreaProvider";

const CancelButtonBase = (props: ButtonProps) => {
    const { areaName } = useActionsAreaProvider();
    const buttonSize = areaName === "header" ? "sm" : "md";
    return <Button text={"Cancel"} {...props} variant="secondary" size={buttonSize} />;
};
export const CancelButton = makeDecoratable("CancelButton", CancelButtonBase);
