import React, { useCallback, useMemo } from "react";
import { css } from "emotion";
import { useSecurity } from "@webiny/app-security";
import ContentModelsDataList from "./ContentModelsDataList";
import NewContentModelDialog from "./NewContentModelDialog";
import { Cell } from "@webiny/ui/Grid";
import { Grid } from "@webiny/ui/Grid";
import CloneContentModelDialog from "./CloneContentModelDialog";

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
        ".mdc-list": {
            overflow: "auto"
        }
    },
    ">.mdc-list": {
        display: "flex",
        flexDirection: "column",
        maxHeight: "calc(100vh - 70px)",
        overflow: "auto"
    }
});

function ContentModels() {
    const [newContentModelDialogOpened, openNewContentModelDialog] = React.useState(false);

    const [cloneContentModel, setCloneContentModel] = React.useState(null);

    const { identity } = useSecurity();

    const canCreate = useMemo(() => {
        const permission = identity.getPermission("cms.contentModel");
        if (!permission) {
            return false;
        }

        if (typeof permission.rwd !== "string") {
            return true;
        }

        return permission.rwd.includes("w");
    }, []);

    const closeModal = useCallback(() => {
        setCloneContentModel(null);
    }, []);

    const onCreate = useCallback(() => openNewContentModelDialog(true), []);
    const onClose = useCallback(() => openNewContentModelDialog(false), []);
    const onClone = useCallback(contentModel => setCloneContentModel(contentModel), []);
    const onCloneClose = useCallback(() => setCloneContentModel(null), []);

    return (
        <>
            <NewContentModelDialog open={newContentModelDialogOpened} onClose={onClose} />
            <CloneContentModelDialog
                open={!!cloneContentModel}
                contentModel={cloneContentModel}
                onClose={onCloneClose}
                closeModal={closeModal}
            />
            <Grid className={grid}>
                <Cell span={3} />
                <Cell span={6} className={centeredContent}>
                    <ContentModelsDataList
                        canCreate={canCreate}
                        onCreate={onCreate}
                        onClone={onClone}
                    />
                </Cell>
                <Cell span={3} />
            </Grid>
        </>
    );
}

export default ContentModels;
