import React from "react";
import { Button, ButtonProps } from "./Button";

export const ButtonSecondary = (props: ButtonProps) => {
    return <Button {...props} variant={"secondary"} />;
};
