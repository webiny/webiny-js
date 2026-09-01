import React, { useEffect } from "react";
import { useFeature } from "@webiny/app";
import type { CmsModel } from "~/types.js";
import { ContentEntriesPresenterFeature } from "../list/feature.js";
import { ContentEntriesPresenter } from "../list/abstractions.js";
import {
    ContentEntryListWithConfig,
    useContentEntryListConfig
} from "~/admin/config/contentEntries/list/ContentEntryListConfig.js";
import { ContentEntryEditorWithConfig } from "~/admin/config/contentEntries/editor/ContentEntryEditorConfig.js";
import { ModelProvider } from "~/admin/components/ModelProvider/index.js";
import { ContentEntriesListLayout } from "./ContentEntriesListLayout.js";
import { RouteParamsSync } from "./RouteParamsSync.js";

interface ListViewProps {
    model: CmsModel;
    initialFolderId?: string;
    initialSearch?: string;
    syncToUrl?: boolean;
}

export const ListView = ({ model, initialFolderId, initialSearch, syncToUrl }: ListViewProps) => {
    const { presenter: listPresenter } = useFeature(ContentEntriesPresenterFeature);

    return (
        <ModelProvider model={model}>
            <ContentEntryListWithConfig>
                <ContentEntryEditorWithConfig>
                    <ListViewInit
                        model={model}
                        listPresenter={listPresenter}
                        initialFolderId={initialFolderId}
                        initialSearch={initialSearch}
                    >
                        <ContentEntriesListLayout />
                        {syncToUrl && <RouteParamsSync modelId={model.modelId} />}
                    </ListViewInit>
                </ContentEntryEditorWithConfig>
            </ContentEntryListWithConfig>
        </ModelProvider>
    );
};

interface ListViewInitProps {
    model: CmsModel;
    listPresenter: ContentEntriesPresenter.Interface;
    initialFolderId?: string;
    initialSearch?: string;
    children: React.ReactNode;
}

const ListViewInit = ({
    listPresenter,
    initialFolderId,
    initialSearch,
    children
}: ListViewInitProps) => {
    const { browser } = useContentEntryListConfig();

    useEffect(() => {
        const filterNames = browser.filters.map(f => f.name);
        listPresenter.init({ filterNames, initialFolderId, initialSearch });

        return () => {
            listPresenter.dispose();
        };
    }, []);

    return <>{children}</>;
};
