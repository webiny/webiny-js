import React from "react";
import { Box as BaseBox, BoxProps as BaseBoxProps } from "@chakra-ui/react";

export type BoxProps = BaseBoxProps;

export const Box = ({ children, ...props }: BaseBoxProps) => {
    return <BaseBox {...props}>{children}</BaseBox>;
};
