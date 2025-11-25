import * as React from "react";
import { makeDecoratable } from "~/utils.js";
import { Button, ButtonProps } from "~/Button/index.js";

const WidgetActionBase = (props: ButtonProps) => {
    return <Button {...props} size="md" />;
};
export const WidgetAction = makeDecoratable("WidgetAction", WidgetActionBase);

