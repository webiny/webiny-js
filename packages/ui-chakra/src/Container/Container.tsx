import React from "react";
import { Container as BaseContainer, ContainerProps as BaseContainerProps } from "@chakra-ui/react";

export type ContainerProps = BaseContainerProps;

export const Container = ({ children, ...props }: BaseContainerProps) => {
    return <BaseContainer {...props}>{children}</BaseContainer>;
};
