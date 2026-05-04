import React, { useMemo, useEffect } from "react";
import { DiContainerProvider, useContainer, useFeature } from "@webiny/app";
import { observer } from "mobx-react-lite";
import { FoldersFeature } from "@webiny/app-aco/features/folders/feature.js";
import { FolderTreePresenterFeature } from "@webiny/app-aco/presentation/folderTree/feature.js";
import { DialogsProvider } from "@webiny/app-admin";
import { FileListPresenterFeature } from "./FileList/feature.js";
import { FileListPresenterProvider } from "./FileList/FileListPresenterProvider.js";
import { FileDetailsPresenterFeature } from "./FileDetails/feature.js";
import { FileDetailsPresenterProvider } from "./FileDetails/FileDetailsPresenterProvider.js";
import { SharedCacheFeature } from "../features/shared/feature.js";
import { ListFilesFeature } from "../features/listFiles/feature.js";
import { GetFileFeature } from "../features/getFile/feature.js";
import { DeleteFileFeature } from "../features/deleteFile/feature.js";
import { UpdateFileFeature } from "../features/updateFile/feature.js";
import { FileUploaderFeature } from "../features/fileUploader/feature.js";
import { ListTagsFeature } from "../features/tags/feature.js";
import { GetSettingsFeature } from "../features/settings/feature.js";
import { FileManagerViewWithConfig } from "~/modules/FileManagerRenderer/FileManagerView/FileManagerViewConfig.js";
import { FileManagerViewAdapter } from "./adapters/FileManagerViewAdapter.js";
// The original UI component — renders the full File Manager layout.
import OriginalFileManagerView from "~/modules/FileManagerRenderer/FileManagerView/FileManagerView.js";
import type { IFileListOverlayConfig } from "./FileList/abstractions.js";
import type { FmFile } from "../features/shared/types.js";

export interface FileManagerViewProps {
    onChange?: (files: FmFile[]) => void;
    onClose?: () => void;
    multiple?: boolean;
    accept?: string[];
    scope?: string;
    children?: React.ReactNode;
}

// Inner component that resolves presenters from the scoped child container.
const FileManagerViewInner = observer(
    ({ onChange, onClose, multiple, accept, scope, children }: FileManagerViewProps) => {
        const { presenter: fileListPresenter } = useFeature(FileListPresenterFeature);
        const { presenter: fileDetailsPresenter } = useFeature(FileDetailsPresenterFeature);

        const overlayConfig = useMemo<IFileListOverlayConfig | undefined>(() => {
            if (!onChange || !onClose) {
                return undefined;
            }
            return { onChange, onClose, multiple, accept, scope };
        }, [onChange, onClose, multiple, accept, scope]);

        useEffect(() => {
            fileListPresenter.init(overlayConfig);
        }, [fileListPresenter, overlayConfig]);

        return (
            <DialogsProvider>
                <FileManagerViewWithConfig>
                    <FileListPresenterProvider presenter={fileListPresenter}>
                        <FileDetailsPresenterProvider presenter={fileDetailsPresenter}>
                            <FileManagerViewAdapter
                                fileListPresenter={fileListPresenter}
                                fileDetailsPresenter={fileDetailsPresenter}
                                overlayConfig={overlayConfig}
                            >
                                <OriginalFileManagerView />
                                {children}
                            </FileManagerViewAdapter>
                        </FileDetailsPresenterProvider>
                    </FileListPresenterProvider>
                </FileManagerViewWithConfig>
            </DialogsProvider>
        );
    }
);

export const FileManagerView = (props: FileManagerViewProps) => {
    const container = useContainer();

    const scopedContainer = useMemo(() => {
        const child = container.createChildContainer();

        // Register shared cache in the scoped container.
        SharedCacheFeature.register(child);

        // Register folder features scoped to FmFile type.
        FoldersFeature.register(child, { type: "FmFile" });
        FolderTreePresenterFeature.register(child);

        // Register headless features in the scoped container.
        ListFilesFeature.register(child);
        GetFileFeature.register(child);
        DeleteFileFeature.register(child);
        UpdateFileFeature.register(child);
        FileUploaderFeature.register(child);
        ListTagsFeature.register(child);
        GetSettingsFeature.register(child);

        // Register presentation features.
        FileListPresenterFeature.register(child);
        FileDetailsPresenterFeature.register(child);

        return child;
    }, []);

    return (
        <DiContainerProvider container={scopedContainer}>
            <FileManagerViewInner {...props} />
        </DiContainerProvider>
    );
};
