import { useState, useMemo, useEffect } from "react";
import { autorun } from "mobx";
import {
    useGetFolderHierarchy,
    useListFoldersByParentIds,
    useNavigateFolder
} from "@webiny/app-aco";
import { DocumentListPresenter } from "~/DocumentList/presenters/index.js";
import { useListPages } from "~/features/pages/index.js";

export const useDocumentList = () => {
    const { folders, getFolderHierarchy } = useGetFolderHierarchy();
    const { listFoldersByParentIds } = useListFoldersByParentIds();
    const { currentFolderId } = useNavigateFolder();
    const { listPages: listDocuments } = useListPages();

    useEffect(() => {
        // List all documents when the current folder changes. Let's reset both search and after params
        listDocuments({
            where: {
                wbyAco_location: {
                    folderId: currentFolderId
                }
            },
            search: "",
            after: ""
        });

        // The folders collection is empty, it must be the first render, let's load the full hierarchy.
        if (folders.length === 0) {
            getFolderHierarchy(currentFolderId);
        } else {
            // Otherwise let's load only the current folder sub-tree
            listFoldersByParentIds([currentFolderId]);
        }
    }, [currentFolderId]);

    const params = useMemo(
        () => ({
            folderId: currentFolderId
        }),
        [currentFolderId]
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
