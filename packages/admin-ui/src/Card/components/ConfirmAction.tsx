import * as React from "react";
import { makeDecoratable } from "~/utils.js";
import { Button, ButtonProps } from "~/Button/index.js";
import { useCardProps } from "./CardPropsProvider.js";

const ConfirmActionBase = (props: ButtonProps) => {
    const { actionsSize } = useCardProps();

    return <Button text={"Confirm"} {...props} variant="primary" size={actionsSize} />;
};
export const ConfirmAction = makeDecoratable("ConfirmAction", ConfirmActionBase);
