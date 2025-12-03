import React from "react";

import { ButtonsProvider } from "./useButtons.js";
import { ButtonContainer } from "./Buttons.styles.js";
import {
    Button,
    type ButtonProps as BaseButtonProps,
    IconButton as BaseIconButton,
    type IconButtonProps as BaseIconButtonProps,
    Tooltip,
    type TooltipProps
} from "@webiny/admin-ui";

interface ButtonProps extends Omit<BaseButtonProps, "onClick"> {
    onAction: (ev?: any) => void;
    children: React.ReactNode;
}

interface IconButtonProps extends Omit<BaseIconButtonProps, "onClick"> {
    label: string;
    onAction: (ev?: any) => void;
    tooltipPlacement?: TooltipProps["side"];
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
        <div className={"flex items-center gap-sm"}>
            {props.actions.map(action => (
                <div className={"empty:hidden leading-none text-0"} key={action.name}>
                    <ButtonsProvider>{action.element}</ButtonsProvider>
                </div>
            ))}
        </div>
    );
};

export { ButtonContainer };

export const ButtonDefault = ({ onAction, children, ...other }: ButtonProps) => {
    return <Button variant={"ghost"} {...other} onClick={onAction} text={children} />;
};

export const ButtonPrimary = ({ onAction, children, ...other }: ButtonProps) => {
    return <Button variant={"primary"} {...other} onClick={onAction} text={children} />;
};

export const ButtonSecondary = ({ onAction, children, ...other }: ButtonProps) => {
    return <Button variant={"secondary"} {...other} onClick={onAction} text={children} />;
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
            <Tooltip
                content={label}
                side={tooltipPlacement}
                trigger={<BaseIconButton variant={"ghost"} {...other} onClick={onAction} />}
            />
        );
    }

    return <BaseIconButton {...other} onClick={onAction} disabled={disabled} />;
};
