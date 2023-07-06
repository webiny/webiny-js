import React from "react";
import {
    ButtonDefault as BaseButtonDefault,
    ButtonPrimary as BaseButtonPrimary,
    ButtonSecondary as BaseButtonSecondary,
    IconButton as BaseIconButton,
    ButtonProps as BaseButtonProps,
    IconButtonProps as BaseIconButtonProps
} from "@webiny/ui/Button";

import { ButtonsProvider } from "./useButtons";
import { ButtonContainer } from "./Buttons.styles";

interface ButtonProps extends Omit<BaseButtonProps, "onClick"> {
    onAction: (ev?: any) => void;
}

interface IconButtonProps extends Omit<BaseIconButtonProps, "onClick"> {
    onAction: (ev?: any) => void;
}

export interface ButtonsProps {
    actions: {
        name: string;
        element: React.ReactElement;
    }[];
}

export const Buttons: React.VFC<ButtonsProps> = props => {
    if (!props.actions.length) {
        return null;
    }

    return (
        <>
            {props.actions.map(action => (
                <ButtonContainer key={action.name}>
                    <ButtonsProvider>{action.element}</ButtonsProvider>
                </ButtonContainer>
            ))}
        </>
    );
};

export const ButtonDefault: React.VFC<ButtonProps> = ({ onAction, ...other }) => {
    return <BaseButtonDefault {...other} onClick={onAction} />;
};

export const ButtonPrimary: React.VFC<ButtonProps> = ({ onAction, ...other }) => {
    return <BaseButtonPrimary {...other} onClick={onAction} />;
};

export const ButtonSecondary: React.VFC<ButtonProps> = ({ onAction, ...other }) => {
    return <BaseButtonSecondary {...other} onClick={onAction} />;
};

export const IconButton: React.VFC<IconButtonProps> = ({ onAction, ...other }) => {
    return <BaseIconButton {...other} onClick={onAction} />;
};
