import React from "react";
import { createProvider } from "@webiny/app";
import { TenancyProvider as ContextProvider } from "./TenancyProvider";

export const createTenancyProvider = () => {
    return createProvider(Original => {
        return function TenancyProvider({ children }) {
            return (
                <ContextProvider>
                    <Original>{children}</Original>
                </ContextProvider>
            );
        };
    });
};
