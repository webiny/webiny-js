import React from "react";
import { useRouter } from "@webiny/react-router";
import { useApolloClient } from "react-apollo";
import { useHandlers } from "@webiny/app/hooks/useHandlers";
import {
    CREATE_REVISION_FROM,
    DELETE_REVISION,
    PUBLISH_REVISION,
    UNPUBLISH_REVISION
} from "@webiny/app-form-builder/admin/graphql";
import { useSnackbar } from "@webiny/app-admin/hooks/useSnackbar";
import { FbFormModel } from "@webiny/app-form-builder/types";
import {
    removeRevisionFromFormCache,
    updateLatestRevisionInListCache,
    addRevisionToRevisionsCache
} from "../../../views/cache";

export type UseRevisionProps = {
    revision: FbFormModel;
    form: FbFormModel;
};

export const useRevision = ({ revision, form }: UseRevisionProps) => {
    const { history } = useRouter();
    const { showSnackbar } = useSnackbar();
    const client = useApolloClient();

    const {
        createRevision,
        editRevision,
        deleteRevision,
        publishRevision,
        unpublishRevision
    } = useHandlers(null, {
        createRevision: () => async () => {
            const { data: res } = await client.mutate({
                mutation: CREATE_REVISION_FROM,
                variables: { revision: revision.id },
                update(cache, { data }) {
                    const newRevision = data.formBuilder.revision.data;
                    updateLatestRevisionInListCache(cache, newRevision);
                    addRevisionToRevisionsCache(cache, newRevision);
                }
            });

            const { data, error } = res.formBuilder.revision;

            if (error) {
                return showSnackbar(error.message);
            }

            history.push(`/forms/${encodeURIComponent(data.id)}`);
        },
        editRevision: () => () => {
            history.push(`/forms/${encodeURIComponent(revision.id)}`);
        },
        deleteRevision: () => async () => {
            await client.mutate({
                mutation: DELETE_REVISION,
                variables: { id: revision.id },
                update: (cache, updated) => {
                    const { error } = updated.data.formBuilder.deleteForm; // `deleteForm` because we assigned an alias
                    if (error) {
                        return showSnackbar(error.message);
                    }

                    // We have other revisions, update form's cache
                    const revisions = removeRevisionFromFormCache(cache, form, revision);

                    if (revision.id === form.id) {
                        updateLatestRevisionInListCache(cache, revisions[0]);
                        // Redirect to the first revision in the list of all form revisions.
                        return history.push("/forms?id=" + encodeURIComponent(revisions[0].id));
                    }
                }
            });
        },
        publishRevision: () => async () => {
            const { data: res } = await client.mutate({
                mutation: PUBLISH_REVISION,
                variables: { id: revision.id }
            });

            const { error } = res.formBuilder.publishRevision;
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
                variables: { id: revision.id }
            });
        }
    });

    return { createRevision, editRevision, deleteRevision, publishRevision, unpublishRevision };
};
