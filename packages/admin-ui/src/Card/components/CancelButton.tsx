import * as React from "react";
import { makeDecoratable } from "~/utils.js";
import { Button, ButtonProps } from "~/Button/index.js";
import { useCardProps } from "./CardPropsProvider.js";

const CancelButtonBase = (props: ButtonProps) => {
    const { actionsSize } = useCardProps();

    return <Button text={"Cancel"} {...props} variant="secondary" size={actionsSize} />;
};
export const CancelButton = makeDecoratable("CancelButton", CancelButtonBase);
