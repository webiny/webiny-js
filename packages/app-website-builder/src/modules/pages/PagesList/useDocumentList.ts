import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { autorun } from "mobx";
import {
    useListFoldersByParentIds,
    useLoadFolderHierarchy,
    useNavigateFolder
} from "@webiny/app-aco";
import { useFilterPages, useLoadPages } from "~/features/pages/index.js";
import { useSelectPages } from "~/features/pages/selectPages/useSelectPages.js";
import { makeDecoratableHook } from "@webiny/react-composition";
import { useFeature } from "@webiny/app";
import { PageListFeature } from "~/presentation/pages/PageList/feature.js";

/**
 * Reads the list view model. Safe to call from any number of components: it performs no data
 * loading, so an extra consumer costs nothing.
 *
 * Loading belongs to `useDocumentListController`, which the list root calls exactly once. Keeping it
 * here would mean every consumer issued its own `listPages` request on mount.
 */
export const useDocumentList = makeDecoratableHook(() => {
    const { currentFolderId } = useNavigateFolder();
    const { filterPages: filterDocuments } = useFilterPages();
    const { presenter } = useFeature(PageListFeature);

    const params = useMemo(
        () => ({
            folderId: currentFolderId
        }),
        [currentFolderId]
    );

    /**
     * Stays here rather than in the controller: it is idempotent and makes no request, and child
     * effects run before the parent's - so a consumer would otherwise render one frame against an
     * uninitialized view model.
     */
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
});

/**
 * Owns the loading of the current folder. Must be called exactly once, by the list root - every call
 * site runs its own copy of the effect below, and each copy issues a `listPages` request.
 */
export const useDocumentListController = () => {
    const isFirstLoad = useRef(true);
    const { folders, loadFolderHierarchy } = useLoadFolderHierarchy();
    const { listFoldersByParentIds } = useListFoldersByParentIds();
    const { loadPages: listDocuments } = useLoadPages();
    const { selectPages: selectDocuments } = useSelectPages();
    const { presenter } = useFeature(PageListFeature);
    const { vm } = useDocumentList();

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
};
