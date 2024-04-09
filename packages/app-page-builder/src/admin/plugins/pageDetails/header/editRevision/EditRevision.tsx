import React, { useCallback, useMemo, useState } from "react";
import { IconButton } from "@webiny/ui/Button";
import { Tooltip } from "@webiny/ui/Tooltip";
import { ReactComponent as EditIcon } from "../../../../assets/edit.svg";
import { CREATE_PAGE } from "~/admin/graphql/pages";
import * as GQLCache from "~/admin/views/Pages/cache";
import { useSnackbar } from "@webiny/app-admin/hooks/useSnackbar";
import { i18n } from "@webiny/app/i18n";
import { useMutation } from "@apollo/react-hooks";
import { usePagesPermissions } from "~/hooks/permissions";
import { useNavigatePage } from "~/admin/hooks/useNavigatePage";
import { useFolders } from "@webiny/app-aco";
import { usePage } from "~/admin/views/Pages/PageDetails";
import { makeDecoratable } from "@webiny/react-composition";

const t = i18n.ns("app-headless-cms/app-page-builder/page-details/header/edit");

const EditRevision = makeDecoratable("EditRevision", () => {
    const { canUpdate: pagesCanUpdate } = usePagesPermissions();
    const { folderLevelPermissions: flp } = useFolders();
    const [inProgress, setInProgress] = useState<boolean>();
    const { showSnackbar } = useSnackbar();
    const [createPageFrom] = useMutation(CREATE_PAGE);
    const { navigateToPageEditor } = useNavigatePage();
    const { page } = usePage();

    const createFromAndEdit = useCallback(async () => {
        setInProgress(true);
        const response = await createPageFrom({
            variables: { from: page.id },
            update(cache, { data }) {
                if (data.pageBuilder.createPage.error) {
                    return;
                }

                GQLCache.updateLatestRevisionInListCache(cache, data.pageBuilder.createPage.data);
            }
        });
        setInProgress(false);
        const { data, error } = response.data.pageBuilder.createPage;
        if (error) {
            return showSnackbar(error.message);
        }
        navigateToPageEditor(data.id);
    }, [page, navigateToPageEditor]);

    const folderId = page.wbyAco_location?.folderId;
    const canEdit = useMemo(() => {
        return pagesCanUpdate(page.createdBy?.id) && flp.canManageContent(folderId);
    }, [flp, folderId]);

    if (!canEdit) {
        return null;
    }

    if (page.locked) {
        return (
            <Tooltip content={t`Edit`} placement={"top"}>
                <IconButton
                    disabled={inProgress}
                    icon={<EditIcon />}
                    onClick={createFromAndEdit}
                    data-testid={"pb-page-details-header-edit-revision"}
                />
            </Tooltip>
        );
    }

    return (
        <Tooltip content={t`Edit`} placement={"top"}>
            <IconButton
                disabled={inProgress}
                icon={<EditIcon />}
                onClick={() => {
                    navigateToPageEditor(page.id);
                }}
                data-testid={"pb-page-details-header-edit-revision"}
            />
        </Tooltip>
    );
});

export default EditRevision;
