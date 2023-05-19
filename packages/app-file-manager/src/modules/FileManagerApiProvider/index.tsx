import React from "react";
import { Plugin, HigherOrderComponent } from "@webiny/app-admin";
import { FileManagerApiProvider } from "./FileManagerApiContext";

const fileManagerApiProvider: HigherOrderComponent = Original => {
    return function FileManager({ children }: { children: React.ReactNode }) {
        return (
            <FileManagerApiProvider>
                <Original>{children}</Original>
            </FileManagerApiProvider>
        );
    };
};

export const FileManagerApiProviderModule = () => {
    return <Plugin providers={[fileManagerApiProvider]} />;
};
