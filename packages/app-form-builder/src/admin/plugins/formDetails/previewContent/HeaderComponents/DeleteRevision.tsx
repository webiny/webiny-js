import React from "react";
import { useApolloClient } from "react-apollo";
import { useRouter } from "@webiny/react-router";
import { useSnackbar } from "@webiny/app-admin/hooks/useSnackbar";
import { IconButton } from "@webiny/ui/Button";
import { Tooltip } from "@webiny/ui/Tooltip";
import { ConfirmationDialog } from "@webiny/ui/ConfirmationDialog";
import { ReactComponent as DeleteIcon } from "../../../../icons/delete.svg";
import * as queries from "../../../../graphql";
import {
    removeFormFromListCache,
    removeRevisionFromFormCache,
    updateLatestRevisionInListCache
} from "../../../../views/cache";

const DeleteRevision = ({ form, revision, selectRevision }) => {
    const { showSnackbar } = useSnackbar();
    const client = useApolloClient();
    const { history } = useRouter();

    let message = "You are about to delete this form revision, are you sure want to continue?";
    const lastRevision = form.revisions.length === 1;
    if (lastRevision) {
        message = "You are about to delete this form. Are you sure want to continue?";
    }

    return (
        <Tooltip content={"Delete"} placement={"top"}>
            <ConfirmationDialog title={"Confirmation required!"} message={message}>
                {({ showConfirmation }) => (
                    <IconButton
                        icon={<DeleteIcon />}
                        onClick={() =>
                            showConfirmation(async () => {
                                await client.mutate({
                                    mutation: lastRevision
                                        ? queries.DELETE_FORM
                                        : queries.DELETE_REVISION,
                                    variables: { id: revision.id },
                                    update: (cache, { data }) => {
                                        const { error } = data.formBuilder.deleteForm;
                                        if (error) {
                                            return showSnackbar(error.message);
                                        }

                                        showSnackbar(
                                            `${
                                                lastRevision ? "Form" : "Revision"
                                            } was deleted successfully!`
                                        );

                                        if (lastRevision) {
                                            removeFormFromListCache(cache, form);

                                            // Redirect
                                            return history.push("/forms");
                                        }

                                        // We have other revisions, update form's cache
                                        const revisions = removeRevisionFromFormCache(
                                            cache,
                                            form,
                                            revision
                                        );

                                        updateLatestRevisionInListCache(cache, revisions[0]);

                                        // Redirect to the first revision in the list of all form revisions.
                                        const firstRevision = revisions[0];
                                        selectRevision(firstRevision);
                                        if (revision.id === form.id) {
                                            return history.push(
                                                "/forms?id=" + encodeURIComponent(firstRevision.id)
                                            );
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

export default DeleteRevision;
