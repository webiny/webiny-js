import React from "react";
import { Icon as BaseIcon, IconProps as BaseIconProps } from "@chakra-ui/react";

export type IconProps = BaseIconProps;

export const Icon = ({ children, ...props }: BaseIconProps) => {
    return <BaseIcon {...props}>{children}</BaseIcon>;
};
