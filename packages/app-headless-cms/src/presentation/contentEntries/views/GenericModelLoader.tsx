import React, { useEffect, useState } from "react";
import { useContainer, useFeature } from "@webiny/app";
import { CmsModelAccessor as CmsModelAccessorAbstraction } from "~/features/contentEntry/abstractions.js";
import { GetModelFeature } from "~/features/model/getModel/feature.js";
import type { CmsModel } from "~/types.js";
import { OverlayLoader } from "@webiny/admin-ui";

interface GenericModelLoaderProps {
    modelId: string;
    children: (model: CmsModel) => React.ReactNode;
}

export const GenericModelLoader = ({ modelId, children }: GenericModelLoaderProps) => {
    const container = useContainer();
    const { useCase: getModelUseCase } = useFeature(GetModelFeature);
    const [model, setModel] = useState<CmsModel | null>(null);
    const [error, setError] = useState<string | null>(null);

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
                console.error("[GenericModelLoader] Failed to load model:", err);
                setError(err instanceof Error ? err.message : String(err));
            });
    }, [modelId]);

    if (error) {
        return <div>Error loading model: {error}</div>;
    }

    if (!model) {
        return <OverlayLoader text={"Loading model..."} />;
    }

    return <>{children(model)}</>;
};
