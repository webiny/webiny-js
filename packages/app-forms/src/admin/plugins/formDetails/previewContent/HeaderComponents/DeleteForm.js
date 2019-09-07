// @flow
import React from "react";
import { useApolloClient } from "react-apollo";
import useReactRouter from "use-react-router";
import { useSnackbar } from "@webiny/app-admin/hooks/useSnackbar";
import { IconButton } from "@webiny/ui/Button";
import { Tooltip } from "@webiny/ui/Tooltip";
import { ReactComponent as DeleteIcon } from "@webiny/app-forms/admin/icons/delete.svg";
import { GET_FORM, DELETE_FORM } from "@webiny/app-forms/admin/viewsGraphql";
import { ConfirmationDialog } from "@webiny/ui/ConfirmationDialog";
import { cloneDeep, get } from "lodash";

type Props = Object;

const DeleteForm = ({ form, revision, selectRevision }: Props) => {
    const { showSnackbar } = useSnackbar();
    const client = useApolloClient();
    const { history } = useReactRouter();

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
                                await client.mutate({
                                    mutation: DELETE_FORM,
                                    variables: { id: revision.id },
                                    refetchQueries: ["FormsListForms"],
                                    update: (cache, updated) => {
                                        const error = get(
                                            updated,
                                            "data.forms.deleteRevision.error"
                                        );
                                        if (error) {
                                            return showSnackbar(error.message);
                                        }

                                        showSnackbar("Form was deleted successfully!");

                                        // If the parent was deleted, there's nothing to see here anymore, so
                                        // we redirect back to the list of all forms.
                                        if (revision.id === revision.parent) {
                                            return history.push("/forms");
                                        }

                                        const gqlParams = {
                                            query: GET_FORM,
                                            variables: { id: form.id }
                                        };
                                        const data = cloneDeep(cache.readQuery(gqlParams));
                                        const indexOfDeleted = data.forms.form.data.revisions.findIndex(
                                            item => item.id === revision.id
                                        );

                                        data.forms.form.data.revisions.splice(indexOfDeleted, 1);
                                        cache.writeQuery({
                                            ...gqlParams,
                                            data
                                        });

                                        // If currently selected revision (from left list of forms) was deleted,
                                        // we redirect to the first revision in the list of all form revision.
                                        const firstRevision = data.forms.form.data.revisions[0];
                                        selectRevision(firstRevision);
                                        if (revision.id === form.id) {
                                            return history.push("/forms?id=" + firstRevision.id);
                                        }
                                    }
                                });
                            })
                        }
                    />
                )}
            </ConfirmationDialog>
        </Tooltip>
    );
};

export default DeleteForm;
