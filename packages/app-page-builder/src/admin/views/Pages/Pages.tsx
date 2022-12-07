import React, { useMemo, useState, useCallback } from "react";
import { SplitView, LeftPanel, RightPanel } from "@webiny/app-admin/components/SplitView";
import PagesDataList from "./PagesDataList";
import PageDetails from "./PageDetails";
import { useSecurity } from "@webiny/app-security";
import CategoriesDialog from "../Categories/CategoriesDialog";
import { CircularProgress } from "@webiny/ui/Progress";
import useImportPage from "./hooks/useImportPage";
import useCreatePage from "./hooks/useCreatePage";
import { PageBuilderSecurityPermission } from "~/types";
import { useRouter } from "@webiny/react-router";
import { useLinks } from "@webiny/app-folders";
import { FOLDER_ID_DEFAULT } from "~/admin/constants/folders";

enum LoadingLabel {
    CREATING_PAGE = "Creating page...",
    IMPORTING_PAGE = "Importing page..."
}

enum Operation {
    CREATE = "create",
    IMPORT = "import"
}

const Pages: React.FC = () => {
    const { history } = useRouter();
    const { createLink } = useLinks(FOLDER_ID_DEFAULT);
    const [operation, setOperation] = useState<string>(Operation.CREATE);
    const [loadingLabel, setLoadingLabel] = useState<string | null>(null);
    const [showCategoriesDialog, setCategoriesDialog] = useState(false);

    const openDialog = useCallback(() => setCategoriesDialog(true), []);
    const closeDialog = useCallback(() => setCategoriesDialog(false), []);

    const { createPageMutation } = useCreatePage({
        setLoadingLabel: () => setLoadingLabel(LoadingLabel.CREATING_PAGE),
        clearLoadingLabel: () => setLoadingLabel(null),
        closeDialog,
        onCreatePageSuccess: async id => {
            await createLink({ id, folderId: FOLDER_ID_DEFAULT });
            history.push(`/page-builder/editor/${encodeURIComponent(id)}`);
        }
    });

    const { showDialog } = useImportPage({
        setLoadingLabel: () => setLoadingLabel(LoadingLabel.IMPORTING_PAGE),
        clearLoadingLabel: () => setLoadingLabel(null),
        closeDialog
    });

    const handleOnCreatePage = useCallback(() => {
        setOperation(Operation.CREATE);
        openDialog();
    }, []);

    const handleOnImportPage = useCallback(() => {
        setOperation(Operation.IMPORT);
        openDialog();
    }, []);

    const onSelect = operation === Operation.CREATE ? createPageMutation : showDialog;

    const { identity, getPermission } = useSecurity();

    const canCreate = useMemo(() => {
        const permission = getPermission<PageBuilderSecurityPermission>("pb.page");
        if (!permission) {
            return false;
        }

        if (typeof permission.rwd !== "string") {
            return true;
        }

        return permission.rwd.includes("w");
    }, [identity]);

    return (
        <>
            <CategoriesDialog open={showCategoriesDialog} onClose={closeDialog} onSelect={onSelect}>
                {loadingLabel && <CircularProgress label={loadingLabel} />}
            </CategoriesDialog>
            <SplitView>
                <LeftPanel span={5}>
                    <PagesDataList
                        canCreate={canCreate}
                        onCreatePage={handleOnCreatePage}
                        onImportPage={handleOnImportPage}
                    />
                </LeftPanel>
                <RightPanel span={7}>
                    <PageDetails canCreate={canCreate} onCreatePage={handleOnCreatePage} />
                </RightPanel>
            </SplitView>
        </>
    );
};

export default Pages;
