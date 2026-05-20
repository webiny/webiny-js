import React, { useEffect } from "react";
import { createProvider } from "@webiny/app";
import { useContainer } from "@webiny/app";
import { Plugin } from "@webiny/app";
import { FileModelProvider } from "~/features/fileModel/index.js";

const FileModelProviderWrapper = createProvider(Original => {
    return function FileModelProviderComponent({ children }) {
        const container = useContainer();

        useEffect(() => {
            void container.resolve(FileModelProvider).getModel();
        }, []);

        return <Original>{children}</Original>;
    };
});

export const FileModelModule = () => {
    return <Plugin providers={[FileModelProviderWrapper]} />;
};
