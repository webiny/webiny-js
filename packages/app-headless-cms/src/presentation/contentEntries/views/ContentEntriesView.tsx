import React, { useMemo } from "react";
import { DiContainerProvider, useContainer } from "@webiny/app";
import { DialogsProvider } from "@webiny/app-admin";
import { FoldersFeature } from "@webiny/app-aco/features/folders/feature.js";
import { FolderTreePresenterFeature } from "@webiny/app-aco/presentation/folderTree/feature.js";
import { CmsModelAccessor } from "~/features/contentEntry/CmsModelAccessor.js";
import { ContentEntriesPresenterFeature } from "../list/feature.js";
import { ContentEntryFormPresenterFeature } from "../form/feature.js";
import { SingletonEntryPresenterFeature } from "../singleton/feature.js";
import {
    BulkPublishFeature,
    BulkUnpublishFeature,
    BulkDeleteFeature,
    BulkMoveFeature
} from "../bulkActions/feature.js";
import { ModelLoader } from "./ModelLoader.js";

export interface ContentEntriesViewProps {
    modelId: string;
    initialFolderId?: string;
    initialSearch?: string;
    syncToUrl?: boolean;
}

export const ContentEntriesView = ({
    modelId,
    initialFolderId,
    initialSearch,
    syncToUrl
}: ContentEntriesViewProps) => {
    const container = useContainer();

    const scopedContainer = useMemo(() => {
        const child = container.createChildContainer();

        FoldersFeature.register(child, { type: `cms:${modelId}` });
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
                <ModelLoader
                    modelId={modelId}
                    initialFolderId={initialFolderId}
                    initialSearch={initialSearch}
                    syncToUrl={syncToUrl}
                />
            </DialogsProvider>
        </DiContainerProvider>
    );
};
