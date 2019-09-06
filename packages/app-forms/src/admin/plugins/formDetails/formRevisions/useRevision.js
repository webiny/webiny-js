// @flow
import React from "react";
import useReactRouter from "use-react-router";
import { useApolloClient } from "react-apollo";
import { cloneDeep, get } from "lodash";
import { useHandlers } from "@webiny/app/hooks/useHandlers";
import {
    GET_FORM,
    CREATE_REVISION_FROM,
    DELETE_REVISION,
    PUBLISH_REVISION,
    UNPUBLISH_REVISION
} from "@webiny/app-forms/admin/viewsGraphql";
import { useSnackbar } from "@webiny/app-admin/components";

export const useRevision = ({ revision, form }) => {
    const { history } = useReactRouter();
    const { showSnackbar } = useSnackbar();
    const client = useApolloClient();

    const { createRevision, editRevision, deleteRevision, publishRevision, unpublishRevision } = useHandlers(null, {
        createRevision: () => async () => {
            const { data: res } = await client.mutate({
                mutation: CREATE_REVISION_FROM,
                variables: { revision: revision.id },
                refetchQueries: ["FormsListForms"]
            });
            const { data, error } = res.forms.revision;

            if (error) {
                return showSnackbar(error.message);
            }

            history.push(`/forms/${data.id}`);
        },
        editRevision: () => () => {
            history.push(`/forms/${revision.id}`);
        },
        deleteRevision: () => async () => {
            await client.mutate({
                mutation: DELETE_REVISION,
                variables: { id: revision.id },
                refetchQueries: ["FormsListForms"],
                update: (cache, updated) => {
                    const error = get(updated, "data.forms.deleteRevision.error");
                    if (error) {
                        return showSnackbar(error.message);
                    }

                    // Should we redirect to list (remove "?id=XYZ" from URL?):
                    // If parent was deleted, that means all revisions were deleted, and we can redirect.
                    if (revision.parent === revision.id) {
                        return history.push("/forms");
                    }

                    const gqlParams = { query: GET_FORM, variables: { id: form.id } };
                    const data = cloneDeep(cache.readQuery(gqlParams));
                    const indexOfDeleted = data.forms.form.data.revisions.findIndex(
                        item => item.id === revision.id
                    );

                    data.forms.form.data.revisions.splice(indexOfDeleted, 1);
                    cache.writeQuery({
                        ...gqlParams,
                        data
                    });

                    // If currently selected revision (from left list of forms) was deleted.
                    if (revision.id === form.id) {
                        return history.push("/forms");
                    }
                }
            });
        },
        publishRevision: () => async () => {
            const { data: res } = await client.mutate({
                mutation: PUBLISH_REVISION,
                variables: { id: revision.id },
                refetchQueries: ["FormsListForms"]
            });

            const { error } = res.forms.publishRevision;
            if (error) {
                return showSnackbar(error.message);
            }

            showSnackbar(
                <span>
                    Successfully published revision <strong>#{revision.version}</strong>!
                </span>
            );
        },
        unpublishRevision: () => async () => {
            await client.mutate({
                mutation: UNPUBLISH_REVISION,
                variables: { id: revision.id },
                refetchQueries: ["FormsListForms"]
            });
        }
    });

    return { createRevision, editRevision, deleteRevision, publishRevision, unpublishRevision };
};
