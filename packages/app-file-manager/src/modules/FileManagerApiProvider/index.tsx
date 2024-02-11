import React from "react";
import { Plugin, GenericDecorator, GenericComponent } from "@webiny/app-admin";
import { FileManagerApiProvider } from "./FileManagerApiContext";
import { FileModelProvider } from "~/modules/FileManagerApiProvider/FileManagerApiContext/FileModelContext";

const fileManagerApiProvider: GenericDecorator<
    GenericComponent<{ children: React.ReactNode }>
> = Original => {
    return function FileManager({ children }) {
        return (
            <FileModelProvider>
                <FileManagerApiProvider>
                    <Original>{children}</Original>
                </FileManagerApiProvider>
            </FileModelProvider>
        );
    };
};

export const FileManagerApiProviderModule = () => {
    return <Plugin providers={[fileManagerApiProvider]} />;
};
