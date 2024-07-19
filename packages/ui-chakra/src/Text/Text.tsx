import React from "react";
import { Text as BaseText, TextProps as BaseTextProps } from "@chakra-ui/react";

export type TextProps = BaseTextProps;

export const Text = ({ children, ...props }: BaseTextProps) => {
    return <BaseText {...props}>{children}</BaseText>;
};
