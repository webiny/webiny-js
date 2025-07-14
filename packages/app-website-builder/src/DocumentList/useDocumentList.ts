import { useCallback, useState, useMemo, useEffect } from "react";
import { autorun } from "mobx";
import {
    useGetFolderHierarchy,
    useListFoldersByParentIds,
    useNavigateFolder
} from "@webiny/app-aco";
import { useDocumentListPresenter } from "./presenters/DocumentListPresenterContext";
import { useFilterPages, useLoadPages } from "~/features/pages/index.js";

export const useDocumentList = () => {
    const { folders, getFolderHierarchy } = useGetFolderHierarchy();
    const { listFoldersByParentIds } = useListFoldersByParentIds();
    const { currentFolderId } = useNavigateFolder();
    const { loadPages: listDocuments } = useLoadPages();
    const { filterPages: filterDocuments } = useFilterPages();
    const presenter = useDocumentListPresenter();

    useEffect(() => {
        // List all documents when the current folder changes. Let's reset both search and after params
        listDocuments({
            folderId: currentFolderId
        });

        // The folders collection is empty, it must be the first render, let's load the full hierarchy.
        if (folders.length === 0) {
            getFolderHierarchy(currentFolderId);
        } else {
            // Otherwise let's load only the current folder sub-tree
            listFoldersByParentIds([currentFolderId]);
        }

        // Close the filter list
        presenter.showFilters(false);
    }, [currentFolderId]);

    const params = useMemo(
        () => ({
            folderId: currentFolderId
        }),
        [currentFolderId]
    );

    useEffect(() => {
        presenter.init(params);
    }, [params, presenter]);

    const [vm, setVm] = useState(presenter.vm);

    useEffect(() => {
        return autorun(() => {
            setVm(presenter.vm);
        });
    }, [presenter]);

    const showFilters = useCallback(
        (show: boolean) => {
            presenter.showFilters(show);

            // When set to false, it will also clear any applied document filters for the current folder.
            if (!show) {
                filterDocuments({}, currentFolderId);
            }
        },
        [presenter]
    );

    return {
        vm,
        showFilters
    };
};
