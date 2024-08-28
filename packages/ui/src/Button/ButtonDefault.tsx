import React from "react";
import { Button, ButtonProps } from "./Button";

export const ButtonDefault = (props: ButtonProps) => {
    return <Button {...props} variant={"primary"} />;
};
