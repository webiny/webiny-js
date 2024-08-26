import React from "react";
import { Button, ButtonProps } from "@webiny/admin-ui/Button";

export const ButtonDefault = (props: ButtonProps) => {
    return <Button {...props} variant={"primary"} />;
};
