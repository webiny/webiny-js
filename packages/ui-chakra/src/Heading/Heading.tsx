import React from "react";
import { Heading as BaseHeading, HeadingProps as BaseHeadingProps } from "@chakra-ui/react";

export type HeadingProps = BaseHeadingProps;

export const Heading = ({ children, ...props }: BaseHeadingProps) => {
    return <BaseHeading {...props}>{children}</BaseHeading>;
};
