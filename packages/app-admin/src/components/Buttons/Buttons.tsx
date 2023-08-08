import React from "react";
import {
    ButtonDefault as BaseButtonDefault,
    ButtonPrimary as BaseButtonPrimary,
    ButtonSecondary as BaseButtonSecondary,
    IconButton as BaseIconButton,
    ButtonProps as BaseButtonProps,
    IconButtonProps as BaseIconButtonProps
} from "@webiny/ui/Button";
import { Tooltip, TooltipProps } from "@webiny/ui/Tooltip";

import { ButtonsProvider } from "./useButtons";
import { ButtonContainer } from "./Buttons.styles";

interface ButtonProps extends Omit<BaseButtonProps, "onClick"> {
    onAction: (ev?: any) => void;
}

interface IconButtonProps extends Omit<BaseIconButtonProps, "onClick"> {
    onAction: (ev?: any) => void;
    tooltipPlacement?: TooltipProps["placement"];
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
                <ButtonContainer key={action.name} className={"button-container"}>
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

export const IconButton: React.VFC<IconButtonProps> = ({
    label,
    onAction,
    tooltipPlacement,
    ...other
}) => {
    if (label) {
        return (
            <Tooltip content={label} placement={tooltipPlacement}>
                <BaseIconButton {...other} onClick={onAction} />
            </Tooltip>
        );
    }

    return <BaseIconButton {...other} onClick={onAction} />;
};
