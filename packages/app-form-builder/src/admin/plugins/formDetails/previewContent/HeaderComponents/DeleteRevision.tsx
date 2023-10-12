import React from "react";
import { useApolloClient } from "@apollo/react-hooks";
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
} from "~/admin/views/cache";
import { usePermission } from "~/hooks/usePermission";
import { FbRevisionModel } from "~/types";

interface DeleteRevisionProps {
    revisions: FbRevisionModel[];
    form: FbRevisionModel;
    revision: FbRevisionModel;
    selectRevision: (revision: FbRevisionModel) => void;
}
const DeleteRevision: React.FC<DeleteRevisionProps> = ({
    revisions,
    form,
    revision,
    selectRevision
}) => {
    const { showSnackbar } = useSnackbar();
    const client = useApolloClient();
    const { history } = useRouter();
    const { canDelete } = usePermission();

    // Render nothing is user doesn't have required permission.
    if (!canDelete(form)) {
        return null;
    }

    let message = "You are about to delete this form revision, are you sure want to continue?";
    const lastRevision = revisions.length === 1;
    if (lastRevision) {
        message = "You are about to delete this form. Are you sure want to continue?";
    }

    return (
        <Tooltip content={"Delete"} placement={"top"}>
            <ConfirmationDialog
                title={"Confirmation required!"}
                message={message}
                data-testid={"fb.form-preview.header.delete-dialog"}
            >
                {({ showConfirmation }) => (
                    <IconButton
                        data-testid={"fb.form-preview.header.delete"}
                        icon={<DeleteIcon />}
                        onClick={() =>
                            showConfirmation(async () => {
                                await client.mutate({
                                    mutation: lastRevision
                                        ? queries.DELETE_FORM
                                        : queries.DELETE_REVISION,
                                    variables: lastRevision
                                        ? { id: revision.id }
                                        : { revision: revision.id },
                                    update: (cache, { data }) => {
                                        const { error } = data.formBuilder.deleteForm;
                                        if (error) {
                                            showSnackbar(error.message);
                                            return;
                                        }

                                        showSnackbar(
                                            `${
                                                lastRevision ? "Form" : "Revision"
                                            } was deleted successfully!`
                                        );

                                        if (lastRevision) {
                                            removeFormFromListCache(cache, form);

                                            // Redirect
                                            history.push("/form-builder/forms");
                                            return;
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
                                        if (revision.id !== form.id) {
                                            return;
                                        }
                                        history.push(
                                            `/form-builder/forms?id=${encodeURIComponent(
                                                firstRevision.id
                                            )}`
                                        );
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
