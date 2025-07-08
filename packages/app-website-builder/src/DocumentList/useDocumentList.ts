import { useState, useMemo, useEffect } from "react";
import { autorun } from "mobx";
import { useGetFolderHierarchy, useNavigateFolder } from "@webiny/app-aco";
import { DocumentListPresenter } from "~/DocumentList/presenters/index.js";
import { useListPages } from "~/features/pages/index.js";
import { paramsRepositoryFactory } from "~/domains/Params/index.js";

export const useDocumentList = () => {
    const { folders, getFolderHierarchy } = useGetFolderHierarchy();
    const { currentFolderId } = useNavigateFolder();
    const { listPages: listDocuments } = useListPages();

    useEffect(() => {
        listDocuments({
            where: {
                wbyAco_location: {
                    folderId: currentFolderId
                }
            },
            search: "",
            after: ""
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
