import React, { useCallback, useState } from "react";
import { IconButton } from "@webiny/ui/Button";
import useReactRouter from "use-react-router";
import { useApolloClient } from "react-apollo";
import { Tooltip } from "@webiny/ui/Tooltip";
import { ReactComponent as EditIcon } from "@webiny/app-page-builder/admin/assets/edit.svg";
import { CREATE_REVISION_FORM } from "@webiny/app-page-builder/admin/graphql/pages";
import { usePageDetails } from "@webiny/app-page-builder/admin/hooks/usePageDetails";
import { useSnackbar } from "@webiny/app-admin/hooks/useSnackbar";
import { get } from "lodash";

const EditRevision = () => {
    const { showSnackbar } = useSnackbar();
    const client = useApolloClient();
    const { history } = useReactRouter();
    const { page } = usePageDetails();
    const [inProgress, setInProgress] = useState();

    const unpublishedRevision = (get(page, "revisions") || []).find(
        item => !item.published && !item.locked
    );

    const editRevision = useCallback(() => {
        if (unpublishedRevision) {
            history.push(`/page-builder/editor/${unpublishedRevision.id}`);
        }
    }, [unpublishedRevision]);

    const copyAndEdit = useCallback(async () => {
        const [latestRevision] = page.revisions;
        setInProgress(true);
        const { data: res } = await client.mutate({
            mutation: CREATE_REVISION_FORM,
            variables: { revision: latestRevision.id },
            refetchQueries: ["PbListPages"],
            awaitRefetchQueries: true
        });
        setInProgress(false);
        const { data, error } = res.pageBuilder.revision;

        if (error) {
            return showSnackbar(error.message);
        }

        history.push(`/page-builder/editor/${data.id}`);
    }, [page]);

    if (unpublishedRevision) {
        return (
            <Tooltip content={"Edit"} placement={"top"}>
                <IconButton
                    disabled={inProgress}
                    icon={<EditIcon />}
                    onClick={editRevision}
                    data-testid={"pb-page-details-header-edit-revision"}
                />
            </Tooltip>
        );
    }

    return (
        <Tooltip content={"Edit"} placement={"top"}>
            <IconButton
                disabled={inProgress}
                icon={<EditIcon />}
                onClick={copyAndEdit}
                data-testid={"pb-page-details-header-edit-revision"}
            />
        </Tooltip>
    );
};

export default EditRevision;
