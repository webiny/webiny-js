import React from "react";
import { CMS_MODEL_SINGLETON_TAG } from "@webiny/app-headless-cms-common";
import { GenericModelLoader } from "./GenericModelLoader.js";
import { SingleEntryView } from "./SingleEntryView.js";
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
                if (model.tags.includes(CMS_MODEL_SINGLETON_TAG)) {
                    return <SingleEntryView model={model} />;
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
