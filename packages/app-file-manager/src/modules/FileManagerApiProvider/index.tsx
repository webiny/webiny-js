import React from "react";
import type { Decorator, GenericComponent } from "@webiny/app-admin";
import { Plugin } from "@webiny/app-admin";
import { FileManagerApiProvider } from "./FileManagerApiContext/index.js";
import { FileModelProvider } from "~/modules/FileManagerApiProvider/FileManagerApiContext/FileModelContext.js";

/**
 * TODO: this will be removed and FileModel will get its own headless feature.
 * Then we'll be able to remove this blocking provider, and make the app bootstrap even snappier.
 */

const fileManagerApiProvider: Decorator<
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
