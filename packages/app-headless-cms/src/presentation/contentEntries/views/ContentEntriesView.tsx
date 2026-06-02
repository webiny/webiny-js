import React, { useEffect, useMemo, useState } from "react";
import { observer } from "mobx-react-lite";
import { DiContainerProvider, useContainer, useFeature } from "@webiny/app";
import { DialogsProvider } from "@webiny/app-admin";
import { ListPresenterFeature } from "@webiny/app-admin/presentation/listPresenter/index.js";
import { FoldersFeature } from "@webiny/app-aco/features/folders/feature.js";
import { FolderTreePresenterFeature } from "@webiny/app-aco/presentation/folderTree/feature.js";
import { FormModelFeature } from "@webiny/app-admin/features/formModel/feature.js";
import { CMS_MODEL_SINGLETON_TAG } from "@webiny/app-headless-cms-common";
import { ContentEntryFeature } from "~/features/contentEntry/feature.js";
import { CmsGraphQLClientFeature } from "~/features/graphQLClient/feature.js";
import { CmsFormModelFeature } from "~/features/formModel/feature.js";
import { ModelFeature } from "~/features/model/feature.js";
import { GetModelFeature } from "~/features/model/getModel/feature.js";
import type { IGetModelUseCase } from "~/features/model/getModel/abstractions.js";
import type { CmsModel } from "~/types.js";
import { ContentEntriesPresenterFeature } from "../list/feature.js";
import { ContentEntryFormPresenterFeature } from "../form/feature.js";
import { SingletonEntryPresenterFeature } from "../singleton/feature.js";
import { ContentEntriesPresenterProvider } from "./ContentEntriesPresenterProvider.js";
import { ContentEntryFormPresenterProvider } from "./ContentEntryFormPresenterProvider.js";
import { ContentEntryListWithConfig } from "~/admin/config/contentEntries/list/ContentEntryListConfig.js";
import { ModelProvider } from "~/admin/components/ModelProvider/index.js";
import { ContentEntriesListLayout } from "./ContentEntriesListLayout.js";
import { SingletonEntryLayout } from "./SingletonEntryLayout.js";
import type { IContentEntriesPresenter } from "../list/abstractions.js";
import type { IContentEntryFormPresenter } from "../form/abstractions.js";
import type { ISingletonEntryPresenter } from "../singleton/abstractions.js";
import { OverlayLoader } from "@webiny/admin-ui";

export interface ContentEntriesViewProps {
    modelId: string;
    children?: React.ReactNode;
}

const ContentEntriesViewInner = ({ modelId, children }: ContentEntriesViewProps) => {
    const [model, setModel] = useState<CmsModel | null>(null);
    const [error, setError] = useState<string | null>(null);

    const { useCase: getModelUseCase } = useFeature(GetModelFeature);
    const { presenter: listPresenter } = useFeature(ContentEntriesPresenterFeature);
    const { presenter: formPresenter } = useFeature(ContentEntryFormPresenterFeature);
    const { presenter: singletonPresenter } = useFeature(SingletonEntryPresenterFeature);

    useEffect(() => {
        listPresenter.init({ modelId });

        getModelUseCase
            .execute({ modelId })
            .then(loadedModel => {
                setModel(loadedModel);

                if (loadedModel.tags?.includes(CMS_MODEL_SINGLETON_TAG)) {
                    singletonPresenter.init({ model: loadedModel });
                } else {
                    listPresenter.setModel(loadedModel);
                }
            })
            .catch(err => {
                console.error("[ContentEntriesView] Failed to load model:", err);
                setError(err instanceof Error ? err.message : String(err));
            });

        return () => {
            listPresenter.dispose();
            singletonPresenter.dispose();
        };
    }, [modelId]);

    if (error) {
        return <div>Error loading model: {error}</div>;
    }

    if (!model) {
        return <OverlayLoader text={"Loading model..."} />;
    }

    if (model.tags?.includes(CMS_MODEL_SINGLETON_TAG)) {
        return (
            <>
                <SingletonEntryLayout presenter={singletonPresenter} />
                {children}
            </>
        );
    }

    return (
        <ModelProvider model={model}>
            <ContentEntryListWithConfig>
                <ContentEntriesPresenterProvider presenter={listPresenter}>
                    <ContentEntryFormPresenterProvider presenter={formPresenter}>
                        <ContentEntriesListLayout />
                        {children}
                    </ContentEntryFormPresenterProvider>
                </ContentEntriesPresenterProvider>
            </ContentEntryListWithConfig>
        </ModelProvider>
    );
};

export const ContentEntriesView = ({ modelId, children }: ContentEntriesViewProps) => {
    const container = useContainer();

    const scopedContainer = useMemo(() => {
        const child = container.createChildContainer();

        CmsGraphQLClientFeature.register(child);
        FormModelFeature.register(child);
        CmsFormModelFeature.register(child);
        ListPresenterFeature.register(child);
        FoldersFeature.register(child, { type: "cms" });
        FolderTreePresenterFeature.register(child);
        ContentEntryFeature.register(child);
        ModelFeature.register(child);
        ContentEntriesPresenterFeature.register(child);
        ContentEntryFormPresenterFeature.register(child);
        SingletonEntryPresenterFeature.register(child);

        return child;
    }, []);

    return (
        <DiContainerProvider container={scopedContainer}>
            <DialogsProvider>
                <ContentEntriesViewInner modelId={modelId}>{children}</ContentEntriesViewInner>
            </DialogsProvider>
        </DiContainerProvider>
    );
};
