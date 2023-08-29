import React from "react";
import { ButtonPrimary } from "@webiny/ui/Button";

export interface ButtonProps {
    onClick: () => void;
}

export const Button: React.VFC<ButtonProps> = ({ onClick }) => {
    return <ButtonPrimary onClick={onClick}>Create new search filter</ButtonPrimary>;
};
