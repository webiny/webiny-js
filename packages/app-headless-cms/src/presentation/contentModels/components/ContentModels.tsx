import React, { useCallback, useEffect, useState } from "react";
import { observer } from "mobx-react-lite";
import { useSecurity } from "@webiny/app-admin";
import type { CmsModel, CmsSecurityPermission } from "~/types.js";
import { Grid } from "@webiny/admin-ui";
import { useContentModelsPresenter } from "../useContentModelsPresenter.js";
import ContentModelsDataList from "./ContentModelsDataList.js";
import NewContentModelDialog from "./NewContentModelDialog.js";
import { CloneContentModelDialog } from "./CloneContentModelDialog.js";
import { ImportContentModelsDialog } from "~/admin/views/contentModels/importing/ImportContentModelsDialog.js";

const ContentModels = observer(() => {
    const presenter = useContentModelsPresenter();

    const [newContentModelDialogOpened, openNewContentModelDialog] = useState(false);
    const [cloneContentModel, setCloneContentModel] = useState<CmsModel | null>(null);
    const [importModels, setImportModels] = useState(false);

    const { identity, getPermission } = useSecurity();

    const canCreate = React.useMemo((): boolean => {
        const permission = getPermission<CmsSecurityPermission>("cms.contentModel");
        if (!permission) {
            return false;
        }
        if (typeof permission.rwd !== "string") {
            return true;
        }
        return permission.rwd.includes("w");
    }, [identity]);

    useEffect(() => {
        presenter.init();
    }, [presenter]);

    const onCreate = useCallback((): void => openNewContentModelDialog(true), []);
    const onClose = useCallback((): void => openNewContentModelDialog(false), []);
    const onClone = useCallback(
        (contentModel: CmsModel): void => setCloneContentModel(contentModel),
        []
    );
    const onCloneClose = useCallback((): void => setCloneContentModel(null), []);
    const showImportModelModal = useCallback(() => setImportModels(true), []);
    const closeImportModelModal = useCallback(() => setImportModels(false), []);

    return (
        <div className={"container h-main-content"}>
            <Grid className="h-full pt-lg">
                <Grid.Column span={10} offset={1}>
                    <div className="h-full border-sm border-b-none border-neutral-dimmed-darker rounded-t-3xl">
                        <ContentModelsDataList
                            showImportModelModal={showImportModelModal}
                            canCreate={canCreate}
                            onCreate={onCreate}
                            onClone={onClone}
                        />
                    </div>
                </Grid.Column>
            </Grid>
            <NewContentModelDialog open={newContentModelDialogOpened} onClose={onClose} />
            {cloneContentModel ? (
                <CloneContentModelDialog
                    contentModel={cloneContentModel}
                    onClose={onCloneClose}
                    closeModal={() => setCloneContentModel(null)}
                />
            ) : null}
            {importModels ? <ImportContentModelsDialog onClose={closeImportModelModal} /> : null}
        </div>
    );
});

export default ContentModels;
