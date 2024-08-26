import React from "react";
import { Button, ButtonProps } from "./Button";

export interface IconButtonProps extends ButtonProps {
    icon: React.ReactNode;
}

export const IconButton = (props: IconButtonProps) => {
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
