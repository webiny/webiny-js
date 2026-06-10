import React, { useEffect, useMemo, useState } from "react";
import { DiContainerProvider, useContainer, useFeature } from "@webiny/app";
import { DialogsProvider } from "@webiny/app-admin";
import { FoldersFeature } from "@webiny/app-aco/features/folders/feature.js";
import { FolderTreePresenterFeature } from "@webiny/app-aco/presentation/folderTree/feature.js";
import { CMS_MODEL_SINGLETON_TAG } from "@webiny/app-headless-cms-common";
import { CmsModelAccessor } from "~/features/contentEntry/CmsModelAccessor.js";
import { CmsModelAccessor as CmsModelAccessorAbstraction } from "~/features/contentEntry/abstractions.js";
import { GetModelFeature } from "~/features/model/getModel/feature.js";
import type { CmsModel } from "~/types.js";
import { ContentEntriesPresenterFeature } from "../list/feature.js";
import { ContentEntryFormPresenterFeature } from "../form/feature.js";
import { SingletonEntryPresenterFeature } from "../singleton/feature.js";
import {
    BulkPublishFeature,
    BulkUnpublishFeature,
    BulkDeleteFeature,
    BulkMoveFeature
} from "../bulkActions/feature.js";
import { ContentEntriesPresenterProvider } from "./ContentEntriesPresenterProvider.js";
import { ContentEntryFormPresenterProvider } from "./ContentEntryFormPresenterProvider.js";
import { ContentEntryListWithConfig } from "~/admin/config/contentEntries/list/ContentEntryListConfig.js";
import { ModelProvider } from "~/admin/components/ModelProvider/index.js";
import { ContentEntriesListLayout } from "./ContentEntriesListLayout.js";
import { SingletonEntryLayout } from "./SingletonEntryLayout.js";
import { OverlayLoader } from "@webiny/admin-ui";

export interface ContentEntriesViewProps {
    modelId: string;
}

interface ModelViewProps {
    model: CmsModel;
}

const SingletonView = ({ model }: ModelViewProps) => {
    const { presenter: singletonPresenter } = useFeature(SingletonEntryPresenterFeature);

    useEffect(() => {
        singletonPresenter.init({ model });

        return () => {
            singletonPresenter.dispose();
        };
    }, [model]);

    return <SingletonEntryLayout presenter={singletonPresenter} />;
};

const ListView = ({ model }: ModelViewProps) => {
    const { presenter: listPresenter } = useFeature(ContentEntriesPresenterFeature);
    const { presenter: formPresenter } = useFeature(ContentEntryFormPresenterFeature);

    useEffect(() => {
        listPresenter.init({ model });

        return () => {
            listPresenter.dispose();
        };
    }, [model]);

    return (
        <ModelProvider model={model}>
            <ContentEntryListWithConfig>
                <ContentEntriesPresenterProvider presenter={listPresenter}>
                    <ContentEntryFormPresenterProvider presenter={formPresenter}>
                        <ContentEntriesListLayout />
                    </ContentEntryFormPresenterProvider>
                </ContentEntriesPresenterProvider>
            </ContentEntryListWithConfig>
        </ModelProvider>
    );
};

interface ModelLoaderProps {
    modelId: string;
}

const ModelLoader = ({ modelId }: ModelLoaderProps) => {
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

    return <ListView model={model} />;
};

export const ContentEntriesView = ({ modelId }: ContentEntriesViewProps) => {
    const container = useContainer();

    const scopedContainer = useMemo(() => {
        const child = container.createChildContainer();

        FoldersFeature.register(child, { type: `cms` });
        FolderTreePresenterFeature.register(child);
        child.register(CmsModelAccessor).inSingletonScope();
        ContentEntriesPresenterFeature.register(child);
        ContentEntryFormPresenterFeature.register(child);
        SingletonEntryPresenterFeature.register(child);
        BulkPublishFeature.register(child);
        BulkUnpublishFeature.register(child);
        BulkDeleteFeature.register(child);
        BulkMoveFeature.register(child);

        return child;
    }, []);

    return (
        <DiContainerProvider container={scopedContainer}>
            <DialogsProvider>
                <ModelLoader modelId={modelId} />
            </DialogsProvider>
        </DiContainerProvider>
    );
};
