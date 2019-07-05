// @flow
import React from "react";
import { compose } from "recompose";
import dot from "dot-prop-immutable";
import { graphql } from "react-apollo";
import { withRouter } from "react-router-dom";
import { withSnackbar } from "webiny-admin/components";
import { IconButton } from "webiny-ui/Button";
import { Tooltip } from "webiny-ui/Tooltip";
import { ReactComponent as DeleteIcon } from "webiny-app-forms/admin/icons/delete.svg";
import { deleteForm } from "webiny-app-forms/admin/viewsGraphql";
import { ConfirmationDialog } from "webiny-ui/ConfirmationDialog";

type Props = Object;

const DeleteForm = ({ history, showSnackbar, form, revision, gqlDeleteForm }: Props) => {
    const parentRevision = revision.parent === revision.id;
    let message = "You are about to delete this form revision, are you sure want to continue?";
    if (parentRevision) {
        message =
            "You are about to delete this form and all of its revisions. Are you sure want to continue?";
    }

    return (
        <Tooltip content={"Delete"} placement={"top"}>
            <ConfirmationDialog title={"Delete form"} message={message}>
                {({ showConfirmation }) => (
                    <IconButton
                        icon={<DeleteIcon />}
                        onClick={() =>
                            showConfirmation(async () => {
                                const { data: res } = await gqlDeleteForm({
                                    variables: { id: revision.id },
                                    refetchQueries: ["FormsListForms"]
                                });

                                const { error } = dot.get(res, "forms.deleteForm");
                                if (error) {
                                    return showSnackbar(error.message);
                                }

                                showSnackbar("Form was deleted successfully!");
                                if (revision.id === parent.id) {
                                    history.push("/forms");
                                }
                            })
                        }
                    />
                )}
            </ConfirmationDialog>
        </Tooltip>
    );
};

export default compose(
    withRouter,
    graphql(deleteForm, { name: "gqlDeleteForm" }),
    withSnackbar()
)(DeleteForm);
