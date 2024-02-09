import React from "react";
import { useRouter } from "@webiny/react-router";
import { useApolloClient } from "@apollo/react-hooks";
import { useHandlers } from "@webiny/app/hooks/useHandlers";
import {
    CREATE_REVISION_FROM,
    CreateRevisionFromMutationResponse,
    CreateRevisionFromMutationVariables,
    GET_FORM_REVISIONS,
    DELETE_REVISION,
    PUBLISH_REVISION,
    UNPUBLISH_REVISION
} from "~/admin/graphql";
import { useSnackbar } from "@webiny/app-admin/hooks/useSnackbar";
import { FbRevisionModel } from "~/types";
import {
    removeRevisionFromFormCache,
    updateLatestRevisionInListCache,
    addRevisionToRevisionsCache
} from "~/admin/views/cache";

interface CreateRevisionCallable {
    (id?: string): Promise<void>;
}

interface EditRevisionCallable {
    (id?: string): void;
}

interface DeleteRevisionCallable {
    (id?: string): Promise<void>;
}

interface PublishRevisionCallable {
    (id?: string): Promise<void>;
}

interface UnpublishRevisionCallable {
    (id?: string): Promise<void>;
}

interface UseRevisionProps {
    revision: FbRevisionModel;
    form: FbRevisionModel;
}

interface UseRevisionResult {
    createRevision: CreateRevisionCallable;
    editRevision: EditRevisionCallable;
    deleteRevision: DeleteRevisionCallable;
    publishRevision: PublishRevisionCallable;
    unpublishRevision: UnpublishRevisionCallable;
}

export const useRevision = ({ revision, form }: UseRevisionProps): UseRevisionResult => {
    const { history } = useRouter();
    const { showSnackbar } = useSnackbar();
    const client = useApolloClient();

    const { createRevision, editRevision, deleteRevision, publishRevision, unpublishRevision } =
        useHandlers(
            {},
            {
                createRevision: (): CreateRevisionCallable => async (id?: string) => {
                    const { data: res } = await client.mutate<
                        CreateRevisionFromMutationResponse,
                        CreateRevisionFromMutationVariables
                    >({
                        mutation: CREATE_REVISION_FROM,
                        variables: {
                            revision: id || revision.id
                        },
                        update(cache, response) {
                            if (!response.data) {
                                return;
                            }
                            const newRevision = response.data.formBuilder.revision.data;
                            updateLatestRevisionInListCache(cache, newRevision);
                            addRevisionToRevisionsCache(cache, newRevision);
                        }
                    });

                    if (!res) {
                        showSnackbar("Missing response data on Create Revision Mutation.");
                        return;
                    }
                    const { data, error } = res.formBuilder.revision;

                    if (error) {
                        showSnackbar(error.message);
                        return;
                    }

                    history.push(`/form-builder/forms/${encodeURIComponent(data.id)}`);
                },
                editRevision: (): EditRevisionCallable => (id?: string) => {
                    const target = encodeURIComponent(id || revision.id);
                    history.push(`/form-builder/forms/${target}`);
                },
                deleteRevision: (): DeleteRevisionCallable => async (id?: string) => {
                    await client.mutate({
                        mutation: DELETE_REVISION,
                        variables: {
                            revision: id || revision.id
                        },
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
                                return history.push(
                                    `/form-builder/forms?id=${encodeURIComponent(revisions[0].id)}`
                                );
                            }
                        }
                    });
                },
                publishRevision: (): PublishRevisionCallable => async (id?: string) => {
                    const { data: res } = await client.mutate({
                        mutation: PUBLISH_REVISION,
                        variables: {
                            revision: id || revision.id
                        },
                        refetchQueries: [
                            { query: GET_FORM_REVISIONS, variables: { id: id || revision.id } }
                        ]
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
                unpublishRevision: (): UnpublishRevisionCallable => async (id?: string) => {
                    await client.mutate({
                        mutation: UNPUBLISH_REVISION,
                        variables: {
                            revision: id || revision.id
                        }
                    });
                }
            }
        );

    return { createRevision, editRevision, deleteRevision, publishRevision, unpublishRevision };
};
