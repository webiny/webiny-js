import React from "react";
import { withRouter } from "react-router-dom";
import { IconButton } from "webiny-ui/Button";
import { Tooltip } from "webiny-ui/Tooltip";
import { ReactComponent as EditIcon } from "webiny-app-cms/admin/assets/edit.svg";
import withRevisionHandlers from "../../formRevisions/withRevisionHandlers";
import { compose } from "recompose";
import { createRevisionFrom } from "webiny-app-cms/admin/graphql/pages";
import { graphql } from "react-apollo";
import { withSnackbar } from "webiny-admin/components";

const EditRevision = ({ revision, history, gqlCreate, showSnackbar }) => {
    if (revision.status === "draft") {
        return (
            <Tooltip content={"Edit"} placement={"top"}>
                <IconButton
                    icon={<EditIcon />}
                    onClick={() => history.push(`/forms/${revision.id}`)}
                />
            </Tooltip>
        );
    }

    return (
        <Tooltip content={"New draft based on this version..."} placement={"top"}>
            <IconButton
                icon={<EditIcon />}
                onClick={async () => {
                    const { data: res } = await gqlCreate({
                        variables: { revision: revision.id },
                        refetchQueries: ["FormsListForms"]
                    });
                    const { data, error } = res.forms.revision;

                    if (error) {
                        return showSnackbar(error.message);
                    }

                    history.push(`/forms/${data.id}`);
                }}
            />
        </Tooltip>
    );
};

export default compose(
    withSnackbar(),
    graphql(createRevisionFrom, { name: "gqlCreate" }),
    withRouter,
    withRevisionHandlers
)(EditRevision);
