import { useCallback, useState, useMemo, useEffect, useRef } from "react";
import { autorun } from "mobx";
import {
    useGetFolderHierarchy,
    useListFoldersByParentIds,
    useNavigateFolder
} from "@webiny/app-aco";
import { useDocumentListPresenter } from "./presenters/DocumentListPresenterContext";
import { useFilterPages, useLoadPages } from "~/features/pages/index.js";
import { useSelectPages } from "~/features/pages/selectPages/useSelectPages.js";

export const useDocumentList = () => {
    const isFirstLoad = useRef(true);
    const { folders, getFolderHierarchy } = useGetFolderHierarchy();
    const { listFoldersByParentIds } = useListFoldersByParentIds();
    const { currentFolderId } = useNavigateFolder();
    const { loadPages: listDocuments } = useLoadPages();
    const { filterPages: filterDocuments } = useFilterPages();
    const { selectPages: selectDocuments } = useSelectPages();
    const presenter = useDocumentListPresenter();

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

    useEffect(() => {
        // The folders collection is empty, it must be the first render, let's load the full hierarchy.
        if (folders.length === 0) {
            getFolderHierarchy(vm.folderId);
        } else {
            // Otherwise let's load only the current folder sub-tree
            listFoldersByParentIds([vm.folderId]);
        }

        // Close the filter list
        presenter.showFilters(false);

        // Unselect any selected items
        selectDocuments([]);

        // List all documents when the current folder changes.
        listDocuments({
            folderId: vm.folderId,
            resetSearch: !isFirstLoad.current
        });
        isFirstLoad.current = false;
    }, [vm.folderId]);

    return {
        vm,
        showFilters
    };
};
