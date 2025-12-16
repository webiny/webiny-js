import { createProvider } from "@webiny/app";
import { useContainer } from "@webiny/app";
import React, { useEffect } from "react";
import { Plugin } from "@webiny/app";
import { FolderModelProvider } from "~/features/folders/abstractions.js";
import { FolderModelProviderFeature } from "./feature.js";

const AcoFolderModelProvider = createProvider(Original => {
    return function AcoFolderProvider({ children }) {
        const container = useContainer();

        useEffect(() => {
            FolderModelProviderFeature.register(container);

            const provider = container.resolve(FolderModelProvider);

            // Trigger loading of a model
            provider.getModel();
        }, []);

        return <Original>{children}</Original>;
    };
});

export const FolderModelProviderModule = () => {
    return <Plugin providers={[AcoFolderModelProvider]} />;
};
