import React, { useCallback, useMemo, useState } from "react";
import { CloneContentModelDialog } from "./CloneContentModelDialog";
import NewContentModelDialog from "./NewContentModelDialog";
import ContentModelsDataList from "./ContentModelsDataList";
import { css } from "emotion";
import { useSecurity } from "@webiny/app-security";
import { Cell, Grid } from "@webiny/ui/Grid";
import { CmsModel, CmsSecurityPermission } from "~/types";
import { ImportContentModelsDialog } from "./importing/ImportContentModelsDialog";

const grid = css({
    "&.mdc-layout-grid": {
        padding: 0,
        backgroundColor: "var(--mdc-theme-background)",
        ">.mdc-layout-grid__inner": {
            gridGap: 0
        }
    }
});

const centeredContent = css({
    backgroundColor: "var(--mdc-theme-surface)",
    ">.webiny-data-list": {
        display: "flex",
        flexDirection: "column",
        height: "calc(100vh - 70px)",
        ".mdc-deprecated-list": {
            overflow: "auto"
        }
    },
    ">.mdc-deprecated-list": {
        display: "flex",
        flexDirection: "column",
        maxHeight: "calc(100vh - 70px)",
        overflow: "auto"
    }
});

const ContentModels = () => {
    const [newContentModelDialogOpened, openNewContentModelDialog] = React.useState(false);

    const [cloneContentModel, setCloneContentModel] = React.useState<CmsModel | null>(null);

    const { identity, getPermission } = useSecurity();

    const canCreate = useMemo((): boolean => {
        const permission = getPermission<CmsSecurityPermission>("cms.contentModel");
        if (!permission) {
            return false;
        }

        if (typeof permission.rwd !== "string") {
            return true;
        }

        return permission.rwd.includes("w");
    }, [identity]);

    const closeCloneModal = useCallback(() => {
        setCloneContentModel(null);
    }, []);

    const onCreate = useCallback((): void => openNewContentModelDialog(true), []);
    const onClose = useCallback((): void => openNewContentModelDialog(false), []);
    const onClone = useCallback(
        (contentModel: CmsModel): void => setCloneContentModel(contentModel),
        []
    );
    const onCloneClose = useCallback((): void => setCloneContentModel(null), []);

    const [importModels, setImportModels] = useState(false);
    const showImportModelModal = useCallback(() => {
        setImportModels(true);
    }, []);
    const closeImportModelModal = useCallback(() => {
        setImportModels(false);
    }, []);

    return (
        <>
            <NewContentModelDialog open={newContentModelDialogOpened} onClose={onClose} />
            {cloneContentModel && (
                <CloneContentModelDialog
                    contentModel={cloneContentModel}
                    onClose={onCloneClose}
                    closeModal={closeCloneModal}
                />
            )}
            {importModels && <ImportContentModelsDialog onClose={closeImportModelModal} />}
            <Grid className={grid}>
                <Cell span={3} />
                <Cell span={6} className={centeredContent}>
                    <ContentModelsDataList
                        showImportModelModal={showImportModelModal}
                        canCreate={canCreate}
                        onCreate={onCreate}
                        onClone={onClone}
                    />
                </Cell>
                <Cell span={3} />
            </Grid>
        </>
    );
};

export default ContentModels;
