import React from "react";
import { Switch as BaseSwitch, SwitchProps as BaseSwitchProps } from "@chakra-ui/react";

export type SwitchProps = BaseSwitchProps;

export const Switch = ({ children, ...props }: BaseSwitchProps) => {
    return <BaseSwitch {...props}>{children}</BaseSwitch>;
};
