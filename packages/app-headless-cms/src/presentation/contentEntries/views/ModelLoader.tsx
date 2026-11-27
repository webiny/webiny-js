import React from "react";
import { isSingletonModel } from "@webiny/app-headless-cms-common";
import { GenericModelLoader } from "./GenericModelLoader.js";
import { SingletonEditorView } from "./SingletonEditorView.js";
import { ListView } from "./ListView.js";

interface ModelLoaderProps {
    modelId: string;
    initialFolderId?: string;
    initialSearch?: string;
    syncToUrl?: boolean;
}

export const ModelLoader = ({
    modelId,
    initialFolderId,
    initialSearch,
    syncToUrl
}: ModelLoaderProps) => {
    return (
        <GenericModelLoader modelId={modelId}>
            {model => {
                if (isSingletonModel(model)) {
                    return <SingletonEditorView model={model} />;
                }

                return (
                    <ListView
                        model={model}
                        initialFolderId={initialFolderId}
                        initialSearch={initialSearch}
                        syncToUrl={syncToUrl}
                    />
                );
            }}
        </GenericModelLoader>
    );
};
