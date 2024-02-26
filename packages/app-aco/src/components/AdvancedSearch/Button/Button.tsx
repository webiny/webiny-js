import React from "react";
import { ButtonDefault } from "@webiny/ui/Button";
import { Icon } from "./Button.styled";

export interface ButtonProps {
    onClick: () => void;
}

export const Button = ({ onClick }: ButtonProps) => {
    return (
        <ButtonDefault onClick={onClick}>
            Advanced search filter <Icon />
        </ButtonDefault>
    );
};
