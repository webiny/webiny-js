import * as React from "react";
import { makeDecoratable } from "~/utils.js";
import { Button, ButtonProps } from "~/Button/index.js";
import { useCardProps } from "./CardProvider.js";

const CancelButtonBase = (props: ButtonProps) => {
    const { actionsSize } = useCardProps();

    console.log("actionsSize", actionsSize);
    return <Button text={"Cancel"} {...props} variant="secondary" size={actionsSize} />;
};
export const CancelButton = makeDecoratable("CancelButton", CancelButtonBase);
