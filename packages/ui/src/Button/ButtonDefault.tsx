import React from "react";
import { Button, ButtonProps } from "@webiny/ui-new/Button";

export const ButtonDefault = (props: ButtonProps) => {
    return <Button {...props} variant={"primary"} />;
};
