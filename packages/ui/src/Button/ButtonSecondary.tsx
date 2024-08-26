import React from "react";
import { Button, ButtonProps } from "@webiny/admin-ui/Button";

export const ButtonSecondary = (props: ButtonProps) => {
    return <Button {...props} variant={"secondary"} />;
};
