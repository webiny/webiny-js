import React from "react";
import { Button, ButtonProps } from "@webiny/ui-new/Button";

export interface IconButtonProps extends ButtonProps {
    icon: React.ReactNode;
}

export const IconButton = (props: IconButtonProps) => {
    return <Button {...props} variant={"primary"} />;
};
