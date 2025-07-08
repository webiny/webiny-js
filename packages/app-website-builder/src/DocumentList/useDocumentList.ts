import { useState, useMemo, useEffect } from "react";
import { autorun } from "mobx";
import { useGetFolderHierarchy, useNavigateFolder } from "@webiny/app-aco";
import { DocumentListPresenter } from "~/DocumentList/presenters/index.js";
import { useListPages } from "~/features/pages/index.js";

export const useDocumentList = () => {
    const { folders, loading: foldersLoadingState, getFolderHierarchy } = useGetFolderHierarchy();
    const { currentFolderId } = useNavigateFolder();
    const {
        pages: documents,
        loading: documentsLoadingState,
        meta: documentMeta,
        listPages: listDocuments
    } = useListPages();

    useEffect(() => {
        listDocuments({
            where: {
                wbyAco_location: {
                    folderId: currentFolderId
                }
            }
        });
    }, [currentFolderId]);

    useEffect(() => {
        if (folders.length > 0) {
            return; // Skip if we already have folders in the cache.
        }

        getFolderHierarchy(currentFolderId);
    }, [currentFolderId]);

    const params = useMemo(
        () => ({
            folderId: currentFolderId,
            documents,
            documentMeta,
            documentsLoadingState,
            folders,
            foldersLoadingState
        }),
        [
            currentFolderId,
            documents,
            documentMeta,
            documentsLoadingState,
            folders,
            foldersLoadingState
        ]
    );

    const presenter = useMemo(() => {
        return new DocumentListPresenter();
    }, []);

    const [vm, setVm] = useState(presenter.vm);

    useEffect(() => {
        presenter.init(params);
    }, [params, presenter]);

    useEffect(() => {
        return autorun(() => {
            setVm(presenter.vm);
        });
    }, [presenter]);

    return {
        vm
    };
};
