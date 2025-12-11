import { useCallback, useState, useMemo, useEffect, useRef } from "react";
import { autorun } from "mobx";
import { useListFoldersByParentIds } from "@webiny/app-aco";
import { useLoadFolderHierarchy } from "@webiny/app-aco";
import { useNavigateFolder } from "@webiny/app-aco";
import { useDocumentListPresenter } from "./presenters/DocumentListPresenterContext.js";
import { useFilterRedirects, useLoadRedirects } from "~/features/redirects/index.js";
import { useSelectRedirects } from "~/features/redirects/selectRedirects/useSelectRedirects.js";

export const useDocumentList = () => {
    const isFirstLoad = useRef(true);
    const { folders, loadFolderHierarchy } = useLoadFolderHierarchy();
    const { listFoldersByParentIds } = useListFoldersByParentIds();
    const { currentFolderId } = useNavigateFolder();
    const { loadRedirects: listDocuments } = useLoadRedirects();
    const { filterRedirects: filterDocuments } = useFilterRedirects();
    const { selectRedirects: selectDocuments } = useSelectRedirects();
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
            loadFolderHierarchy(vm.folderId);
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
