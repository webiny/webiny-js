import React from "react";
import { Button, ButtonProps } from "./Button";
import { makeDecoratable } from "@webiny/react-composition";

interface IconButtonProps extends ButtonProps {
    icon: React.ReactNode;
}

const IconButtonBase = (props: IconButtonProps) => {
    const { icon, text, ...rest } = props;
    return (
        <Button
            variant={"ghost"}
            text={
                <>
                    {icon} {text}
                </>
            }
            {...rest}
        />
    );
};

const IconButton = makeDecoratable("IconButton", IconButtonBase);

export { IconButton, IconButtonProps };
