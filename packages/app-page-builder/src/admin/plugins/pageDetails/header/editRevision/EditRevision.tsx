import React, { useCallback, useState } from "react";
import { IconButton } from "@webiny/ui/Button";
import { useRouter } from "@webiny/react-router";
import { Tooltip } from "@webiny/ui/Tooltip";
import { ReactComponent as EditIcon } from "../../../../assets/edit.svg";
import { CREATE_PAGE } from "~/admin/graphql/pages";
import * as GQLCache from "~/admin/views/Pages/cache";
import { useSnackbar } from "@webiny/app-admin/hooks/useSnackbar";
import { i18n } from "@webiny/app/i18n";
import { useMutation } from "@apollo/react-hooks";
import { usePagesPermissions } from "~/hooks/permissions";
import { PbPageData } from "~/types";

const t = i18n.ns("app-headless-cms/app-page-builder/page-details/header/edit");

interface EditRevisionProps {
    page: PbPageData;
}
const EditRevision: React.FC<EditRevisionProps> = props => {
    const { page } = props;
    const { canUpdate } = usePagesPermissions();
    const { history } = useRouter();
    const [inProgress, setInProgress] = useState<boolean>();
    const { showSnackbar } = useSnackbar();
    const [createPageFrom] = useMutation(CREATE_PAGE);

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
        history.push(`/page-builder/editor/${encodeURIComponent(data.id)}`);
    }, [page]);

    if (!canUpdate(page?.createdBy?.id)) {
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
                    history.push(`/page-builder/editor/${encodeURIComponent(page.id)}`);
                }}
                data-testid={"pb-page-details-header-edit-revision"}
            />
        </Tooltip>
    );
};

export default EditRevision;
