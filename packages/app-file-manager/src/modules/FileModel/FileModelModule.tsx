import React from "react";
import type { Decorator, GenericComponent } from "@webiny/app-admin";
import { Plugin } from "@webiny/app-admin";
import { FileModelProvider } from "./FileModelContext.js";

const fileModelProvider: Decorator<GenericComponent<{ children: React.ReactNode }>> = Original => {
    return function FileModelProviderDecorator({ children }) {
        return (
            <FileModelProvider>
                <Original>{children}</Original>
            </FileModelProvider>
        );
    };
};

export const FileModelModule = () => {
    return <Plugin providers={[fileModelProvider]} />;
};
