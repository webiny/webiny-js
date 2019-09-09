import React, { useCallback } from "react";
import { IconButton } from "@webiny/ui/Button";
import useReactRouter from "use-react-router";
import { useApolloClient } from "react-apollo";
import { Tooltip } from "@webiny/ui/Tooltip";
import { ReactComponent as EditIcon } from "@webiny/app-page-builder/admin/assets/edit.svg";
import { createRevisionFrom } from "@webiny/app-page-builder/admin/graphql/pages";
import { usePageDetails } from "@webiny/app-page-builder/admin/hooks/usePageDetails";
import { useSnackbar } from "@webiny/app-admin/hooks/useSnackbar";
import { get } from "lodash";

const EditRevision = () => {
    const { showSnackbar } = useSnackbar();
    const client = useApolloClient();
    const { history } = useReactRouter();
    const { page } = usePageDetails();

    const unpublishedRevision = (get(page, "revisions") || []).find(
        item => !item.published && !item.locked
    );

    const editRevision = useCallback(() => {
        if (unpublishedRevision) {
            history.push(`/page-builder/editor/${unpublishedRevision.id}`);
        }
    });

    const copyAndEdit = useCallback(async () => {
        const [latestRevision] = page.revisions;
        const { data: res } = await client.mutate({
            mutation: createRevisionFrom,
            variables: { revision: latestRevision.id },
            refetchQueries: ["PbListPages"]
        });
        const { data, error } = res.pageBuilder.revision;

        if (error) {
            return showSnackbar(error.message);
        }

        history.push(`/page-builder/editor/${data.id}`);
    });

    if (unpublishedRevision) {
        return (
            <Tooltip content={"Edit"} placement={"top"}>
                <IconButton icon={<EditIcon />} onClick={editRevision} />
            </Tooltip>
        );
    }

    return (
        <Tooltip content={"Edit"} placement={"top"}>
            <IconButton icon={<EditIcon />} onClick={copyAndEdit} />
        </Tooltip>
    );
};

export default EditRevision;
