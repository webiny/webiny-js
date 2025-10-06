import React from "react";
import { Container } from "@webiny/di-container";
import { createGenericContext } from "~/utils/createGenericContext.js";

type DiContainerContext = { container: Container };

const DiContainerContext = createGenericContext<DiContainerContext>("DiContainer");

export interface DiContainerProviderProps {
    container: Container;
    children: React.ReactNode;
}

export const DiContainerProvider = ({ container, children }: DiContainerProviderProps) => {
    return (
        <DiContainerContext.Provider container={container}>{children}</DiContainerContext.Provider>
    );
};

export const useContainer = () => {
    const context = DiContainerContext.useHook();

    return context.container;
};
