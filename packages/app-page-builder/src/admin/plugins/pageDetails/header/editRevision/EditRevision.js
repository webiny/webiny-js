import React, { useCallback } from "react";
import { withRouter } from "react-router-dom";
import { IconButton } from "@webiny/ui/Button";
import { Tooltip } from "@webiny/ui/Tooltip";
import { ReactComponent as EditIcon } from "@webiny/app-page-builder/admin/assets/edit.svg";
import withRevisionHandlers from "../../pageRevisions/withRevisionHandlers";
import { compose } from "recompose";
import { createRevisionFrom } from "@webiny/app-page-builder/admin/graphql/pages";
import { graphql } from "react-apollo";
import { withSnackbar } from "@webiny/app-admin/components";
import { get } from "lodash";

const EditRevision = ({ pageDetails: { page }, history, gqlCreate, showSnackbar }) => {
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
        const { data: res } = await gqlCreate({
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

export default compose(
    withSnackbar(),
    graphql(createRevisionFrom, { name: "gqlCreate" }),
    withRouter,
    withRevisionHandlers
)(EditRevision);
