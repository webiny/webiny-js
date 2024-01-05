import React from "react";
import { useApolloClient } from "@apollo/react-hooks";
import { useRouter } from "@webiny/react-router";
import { useSnackbar } from "@webiny/app-admin/hooks/useSnackbar";
import { IconButton } from "@webiny/ui/Button";
import { Tooltip } from "@webiny/ui/Tooltip";
import { ConfirmationDialog } from "@webiny/ui/ConfirmationDialog";
import { ReactComponent as DeleteIcon } from "../../../../icons/delete.svg";
import * as queries from "../../../../graphql";
import { removeFormFromListCache } from "~/admin/views/cache";
import { usePermission } from "~/hooks/usePermission";
import { FbRevisionModel } from "~/types";

interface DeleteRevisionProps {
    form: FbRevisionModel;
    revision: FbRevisionModel;
}
const DeleteForm = ({ form, revision }: DeleteRevisionProps) => {
    const { showSnackbar } = useSnackbar();
    const client = useApolloClient();
    const { history } = useRouter();
    const { canDelete } = usePermission();

    // Render nothing is user doesn't have required permission.
    if (!canDelete(form)) {
        return null;
    }

    const message = "You are about to delete this form. Are you sure want to continue?";

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
                                    mutation: queries.DELETE_FORM,
                                    variables: { id: revision.id },
                                    update: (cache, { data }) => {
                                        const { error } = data.formBuilder.deleteForm;
                                        if (error) {
                                            showSnackbar(error.message);
                                            return;
                                        }

                                        showSnackbar(`Form was deleted successfully!`);

                                        removeFormFromListCache(cache, form);

                                        // Redirect
                                        history.push("/form-builder/forms");
                                        return;
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
