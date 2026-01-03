import React from "react";
import { makeDecoratable } from "@webiny/app-admin";

export interface ContainerProps {
    children: React.ReactNode;
}

export const Container = makeDecoratable(
    "FederatedProvidersContainer",
    ({ children }: ContainerProps) => {
        return <div className={"flex flex-col gap-xs"}>{children}</div>;
    }
);

export const FederatedProviders = {
    Container
};
