import React, { useMemo } from "react";
import { useRouter } from "@webiny/react-router";
import { useHandlers } from "@webiny/app/hooks/useHandlers";
import { useSnackbar } from "@webiny/app-admin/hooks/useSnackbar";
import { CmsEditorContentEntry } from "~/types";
import * as GQL from "~/admin/graphql/contentEntries";
import * as GQLCache from "./cache";
import { useApolloClient, useCms } from "~/admin/hooks";
import { useContentEntry } from "~/admin/views/contentEntries/hooks/useContentEntry";
import {
    CmsEntryCreateFromMutationResponse,
    CmsEntryCreateFromMutationVariables,
    CmsEntryRequestChangesMutationResponse,
    CmsEntryRequestChangesMutationVariables,
    CmsEntryRequestReviewMutationResponse,
    CmsEntryRequestReviewMutationVariables,
    CmsEntryUnpublishMutationResponse,
    CmsEntryUnpublishMutationVariables
} from "~/admin/graphql/contentEntries";

interface CreateRevisionHandler {
    (id?: string): Promise<void>;
}
interface EditRevisionHandler {
    (id?: string): void;
}
interface DeleteRevisionHandler {
    (id?: string): Promise<void>;
}
interface PublishRevisionHandler {
    (id?: string): Promise<void>;
}
interface UnpublishRevisionHandler {
    (id?: string): Promise<void>;
}
interface RequestReviewHandler {
    (id?: string): Promise<void>;
}
interface RequestChangesHandler {
    (id?: string): Promise<void>;
}
interface UseRevisionHandlers {
    createRevision: CreateRevisionHandler;
    editRevision: EditRevisionHandler;
    deleteRevision: DeleteRevisionHandler;
    publishRevision: PublishRevisionHandler;
    unpublishRevision: UnpublishRevisionHandler;
    requestReview: RequestReviewHandler;
    requestChanges: RequestChangesHandler;
}

export interface UseRevisionProps {
    revision: CmsEditorContentEntry;
}

export const useRevision = ({ revision }: UseRevisionProps) => {
    const { publishEntryRevision, deleteEntry } = useCms();
    const { contentModel, entry, setLoading, listQueryVariables } = useContentEntry();

    const { history } = useRouter();
    const { showSnackbar } = useSnackbar();
    const client = useApolloClient();
    const { modelId } = contentModel;

    const { CREATE_REVISION, UNPUBLISH_REVISION, REQUEST_REVIEW, REQUEST_CHANGES } = useMemo(() => {
        return {
            CREATE_REVISION: GQL.createCreateFromMutation(contentModel),
            UNPUBLISH_REVISION: GQL.createUnpublishMutation(contentModel),
            REQUEST_REVIEW: GQL.createRequestReviewMutation(contentModel),
            REQUEST_CHANGES: GQL.createRequestChangesMutation(contentModel)
        };
    }, [modelId]);

    const {
        createRevision,
        editRevision,
        deleteRevision,
        publishRevision,
        unpublishRevision,
        requestReview,
        requestChanges
    } = useHandlers<UseRevisionHandlers>(
        { entry },
        {
            createRevision:
                (): CreateRevisionHandler =>
                async (id): Promise<void> => {
                    setLoading(true);
                    const createResponse = await client.mutate<
                        CmsEntryCreateFromMutationResponse,
                        CmsEntryCreateFromMutationVariables
                    >({
                        mutation: CREATE_REVISION,
                        variables: {
                            revision: id || revision.id
                        },
                        update(cache, result) {
                            if (!result || !result.data) {
                                showSnackbar(
                                    `Missing result in update callback on Create Revision Mutation.`
                                );
                                return;
                            }
                            const newRevision = result.data.content.data;
                            if (!newRevision) {
                                showSnackbar(
                                    "Missing revision data in update callback on Create Revision Mutation."
                                );
                                return;
                            }

                            GQLCache.updateLatestRevisionInListCache(
                                contentModel,
                                cache,
                                newRevision,
                                listQueryVariables
                            );
                            GQLCache.addRevisionToRevisionsCache(contentModel, cache, newRevision);
                        }
                    });

                    setLoading(false);
                    if (!createResponse || !createResponse.data) {
                        showSnackbar(`Missing response data in Create Revision Callable.`);
                        return;
                    }

                    const { data, error } = createResponse.data.content;

                    if (error) {
                        showSnackbar(error.message);
                        return;
                    } else if (!data) {
                        showSnackbar(`Missing data in Create Revision callable.`);
                        return;
                    }

                    history.push(
                        `/cms/content-entries/${modelId}?id=${encodeURIComponent(data.id)}`
                    );
                },
            editRevision:
                (): EditRevisionHandler =>
                (id): void => {
                    history.push(
                        `/cms/content-entries/${modelId}/?id=${encodeURIComponent(
                            id || revision.id
                        )}`
                    );
                },
            deleteRevision:
                ({ entry }): DeleteRevisionHandler =>
                async (id): Promise<void> => {
                    setLoading(true);

                    const { error, entry: targetRevision } = await deleteEntry({
                        model: contentModel,
                        entry,
                        id: id || entry.id,
                        listQueryVariables
                    });

                    setLoading(false);

                    if (error) {
                        showSnackbar(error.message);
                        return;
                    }

                    // Redirect to the first revision in the list of all entry revisions.
                    history.push(
                        `/cms/content-entries/${modelId}?id=` +
                            encodeURIComponent(targetRevision!.id)
                    );
                },
            publishRevision:
                ({ entry }): PublishRevisionHandler =>
                async id => {
                    setLoading(true);

                    const response = await publishEntryRevision({
                        model: contentModel,
                        entry: entry,
                        id: id || entry.id,
                        listQueryVariables
                    });

                    setLoading(false);

                    const { error } = response;
                    if (error) {
                        showSnackbar(error.message);
                        return;
                    }

                    showSnackbar(
                        <span>
                            Successfully published revision{" "}
                            <strong>#{response.entry!.meta.version}</strong>!
                        </span>
                    );
                },
            unpublishRevision:
                (): UnpublishRevisionHandler =>
                async (id): Promise<void> => {
                    setLoading(true);
                    const result = await client.mutate<
                        CmsEntryUnpublishMutationResponse,
                        CmsEntryUnpublishMutationVariables
                    >({
                        mutation: UNPUBLISH_REVISION,
                        variables: {
                            revision: id || revision.id
                        }
                    });
                    setLoading(false);
                    if (!result || !result.data) {
                        showSnackbar(`Missing result in update callback on Unpublish Mutation.`);
                        return;
                    }

                    const { error } = result.data.content;
                    if (error) {
                        showSnackbar(error.message);
                        return;
                    }

                    showSnackbar(
                        <span>
                            Successfully unpublished revision{" "}
                            <strong>#{revision.meta.version}</strong>!
                        </span>
                    );
                },
            requestReview:
                (): RequestReviewHandler =>
                async (id): Promise<void> => {
                    setLoading(true);
                    await client.mutate<
                        CmsEntryRequestReviewMutationResponse,
                        CmsEntryRequestReviewMutationVariables
                    >({
                        mutation: REQUEST_REVIEW,
                        variables: {
                            revision: id || revision.id
                        },
                        update(_, result) {
                            if (!result || !result.data) {
                                showSnackbar(
                                    `Missing result in update callback on Request Review Mutation.`
                                );
                                return;
                            }
                            const { error } = result.data.content;
                            if (error) {
                                return showSnackbar(error.message);
                            }

                            showSnackbar(<span>Review requested successfully!</span>);
                        }
                    });

                    setLoading(false);
                },
            requestChanges:
                (): RequestChangesHandler =>
                async (id): Promise<void> => {
                    setLoading(true);
                    await client.mutate<
                        CmsEntryRequestChangesMutationResponse,
                        CmsEntryRequestChangesMutationVariables
                    >({
                        mutation: REQUEST_CHANGES,
                        variables: {
                            revision: id || revision.id
                        },
                        update(_, result) {
                            if (!result || !result.data) {
                                showSnackbar(
                                    `Missing result in update callback on Request Changes Mutation.`
                                );
                                return;
                            }
                            const { error } = result.data.content;
                            if (error) {
                                showSnackbar(error.message);
                                return;
                            }

                            showSnackbar(<span>Changes requested successfully!</span>);
                        }
                    });

                    setLoading(false);
                }
        }
    );

    return {
        createRevision,
        editRevision,
        deleteRevision,
        publishRevision,
        unpublishRevision,
        requestReview,
        requestChanges
    };
};
