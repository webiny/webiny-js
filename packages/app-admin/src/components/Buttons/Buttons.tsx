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

export const Buttons = (props: ButtonsProps) => {
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

export { ButtonContainer };

export const ButtonDefault = ({ onAction, ...other }: ButtonProps) => {
    return <BaseButtonDefault {...other} onClick={onAction} />;
};

export const ButtonPrimary = ({ onAction, ...other }: ButtonProps) => {
    return <BaseButtonPrimary {...other} onClick={onAction} />;
};

export const ButtonSecondary = ({ onAction, ...other }: ButtonProps) => {
    return <BaseButtonSecondary {...other} onClick={onAction} />;
};

export const IconButton = ({
    label,
    onAction,
    tooltipPlacement,
    disabled,
    ...other
}: IconButtonProps) => {
    if (label && !disabled) {
        return (
            <Tooltip content={label} placement={tooltipPlacement}>
                <BaseIconButton {...other} onClick={onAction} />
            </Tooltip>
        );
    }

    return <BaseIconButton {...other} onClick={onAction} disabled={disabled} />;
};
