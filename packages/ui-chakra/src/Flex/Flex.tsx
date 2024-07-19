import React from "react";
import { Flex as BaseFlex, FlexProps as BaseFlexProps } from "@chakra-ui/react";

export type FlexProps = BaseFlexProps;

export const Flex = ({ children, ...props }: BaseFlexProps) => {
    return <BaseFlex {...props}>{children}</BaseFlex>;
};
