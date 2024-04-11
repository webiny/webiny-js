import React from "react";
import styled from "@emotion/styled";
import { makeDecoratable } from "@webiny/app-admin";

const FlexContainer = styled.div`
    display: flex;
    column-gap: 10px;
    padding-top: 20px;
    justify-content: center;
`;

export interface ContainerProps {
    children: React.ReactNode;
}

export const Container = makeDecoratable(
    "FederatedProvidersContainer",
    ({ children }: ContainerProps) => {
        return <FlexContainer>{children}</FlexContainer>;
    }
);

export const FederatedProviders = {
    Container
};
