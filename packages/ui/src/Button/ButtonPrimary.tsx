import React from "react";
import { Button, ButtonProps } from "@webiny/admin-ui/Button";

export const ButtonPrimary = (props: ButtonProps) => {
    return <Button {...props} variant={"primary"} />;
};
