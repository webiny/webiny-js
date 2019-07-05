import React, { useCallback } from "react";
import { withRouter } from "react-router-dom";
import { IconButton } from "webiny-ui/Button";
import { Tooltip } from "webiny-ui/Tooltip";
import { ReactComponent as EditIcon } from "webiny-app-cms/admin/assets/edit.svg";
import withRevisionHandlers from "../../../formRevisions/withRevisionHandlers";
import { compose } from "recompose";
import { createRevisionFrom } from "webiny-app-cms/admin/graphql/pages";
import { graphql } from "react-apollo";
import { withSnackbar } from "webiny-admin/components";
import { get } from "lodash";

const EditRevision = ({ form, history, gqlCreate, showSnackbar }) => {
    const unpublishedRevision = (get(form, "revisions") || []).find(
        item => !item.published && !item.locked
    );

    const editRevision = useCallback(() => {
        if (unpublishedRevision) {
            history.push(`/forms/${unpublishedRevision.id}`);
        }
    });

    const copyAndEdit = useCallback(async () => {
        const [latestRevision] = form.revisions;
        const { data: res } = await gqlCreate({
            variables: { revision: latestRevision.id },
            refetchQueries: ["FormsListForms"]
        });
        const { data, error } = res.cms.revision;

        if (error) {
            return showSnackbar(error.message);
        }

        history.push(`/forms/${data.id}`);
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
