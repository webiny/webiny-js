import * as React from "react";
import { makeDecoratable } from "~/utils.js";
import { Button, ButtonProps } from "~/Button/index.js";
import { useWidgetProps } from "./WidgetPropsProvider.js";

const CancelActionBase = (props: ButtonProps) => {
    const { actionsSize } = useWidgetProps();

    return <Button text={"Cancel"} {...props} variant="secondary" size={actionsSize} />;
};
export const CancelAction = makeDecoratable("CancelAction", CancelActionBase);

