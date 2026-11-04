import React, { useMemo } from "react";
import { DiContainerProvider, useContainer } from "@webiny/app";
import { DialogsProvider } from "@webiny/app-admin";
import { FoldersFeature } from "@webiny/app-aco/features/folders/feature.js";
import { FolderTreePresenterFeature } from "@webiny/app-aco/presentation/folderTree/feature.js";
import { CmsModelContext } from "~/features/contentEntry/CmsModelContext.js";
import { ContentEntriesPresenterFeature } from "../list/feature.js";
import { ContentEntryFormPresenterFeature } from "../form/feature.js";
import { SingleEntryPresenterFeature } from "../singleEntry/feature.js";
import {
    BulkPublishFeature,
    BulkUnpublishFeature,
    BulkDeleteFeature,
    BulkMoveFeature
} from "../bulkActions/feature.js";
import { RevisionsListFeature } from "../revisionsList/feature.js";
import { CmsTrashBinFeature } from "~/features/contentEntry/trashBin/feature.js";
import { TableRowMapper } from "./Table/TableRowMapper.js";
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
        child.register(CmsModelContext).inSingletonScope();
        ContentEntriesPresenterFeature.register(child);
        ContentEntryFormPresenterFeature.register(child);
        RevisionsListFeature.register(child);
        SingleEntryPresenterFeature.register(child);
        BulkPublishFeature.register(child);
        BulkUnpublishFeature.register(child);
        BulkDeleteFeature.register(child);
        BulkMoveFeature.register(child);
        // The trash bin lists the deleted entries of this view's model, so it reads CmsModelContext
        // and has to live here with it. Registered at the root, its singletons can't see the model.
        CmsTrashBinFeature.register(child);
        child.register(TableRowMapper);

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
