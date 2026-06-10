import React, { useEffect, useState } from "react";
import { useContainer, useFeature } from "@webiny/app";
import { CMS_MODEL_SINGLETON_TAG } from "@webiny/app-headless-cms-common";
import { CmsModelAccessor as CmsModelAccessorAbstraction } from "~/features/contentEntry/abstractions.js";
import { GetModelFeature } from "~/features/model/getModel/feature.js";
import type { CmsModel } from "~/types.js";
import { OverlayLoader } from "@webiny/admin-ui";
import { SingletonView } from "./SingletonView.js";
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
    const [model, setModel] = useState<CmsModel | null>(null);
    const [error, setError] = useState<string | null>(null);
    const container = useContainer();
    const { useCase: getModelUseCase } = useFeature(GetModelFeature);

    useEffect(() => {
        setModel(null);
        setError(null);

        getModelUseCase
            .execute({ modelId })
            .then(loadedModel => {
                container.resolve(CmsModelAccessorAbstraction).setModel(loadedModel);
                setModel(loadedModel);
            })
            .catch(err => {
                console.error("[ContentEntriesView] Failed to load model:", err);
                setError(err instanceof Error ? err.message : String(err));
            });
    }, [modelId]);

    if (error) {
        return <div>Error loading model: {error}</div>;
    }

    if (!model) {
        return <OverlayLoader text={"Loading model..."} />;
    }

    if (model.tags.includes(CMS_MODEL_SINGLETON_TAG)) {
        return <SingletonView model={model} />;
    }

    return (
        <ListView
            model={model}
            initialFolderId={initialFolderId}
            initialSearch={initialSearch}
            syncToUrl={syncToUrl}
        />
    );
};
