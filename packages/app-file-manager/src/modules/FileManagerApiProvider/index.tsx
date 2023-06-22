import React from "react";
import { Plugin, HigherOrderComponent } from "@webiny/app-admin";
import { FileManagerApiProvider } from "./FileManagerApiContext";
import { FileModelProvider } from "~/modules/FileManagerApiProvider/FileManagerApiContext/FileModelContext";

const fileManagerApiProvider: HigherOrderComponent = Original => {
    return function FileManager({ children }: { children: React.ReactNode }) {
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
