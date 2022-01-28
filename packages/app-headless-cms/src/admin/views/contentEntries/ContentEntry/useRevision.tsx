import React, { useMemo } from "react";
import { useRouter } from "@webiny/react-router";
import { useHandlers } from "@webiny/app/hooks/useHandlers";
import { useSnackbar } from "@webiny/app-admin/hooks/useSnackbar";
import { CmsEditorContentEntry } from "~/types";
import * as GQL from "~/admin/graphql/contentEntries";
import * as GQLCache from "./cache";
import { useApolloClient } from "~/admin/hooks";
import { useContentEntry } from "~/admin/views/contentEntries/hooks/useContentEntry";
import {
    CmsEntryDeleteMutationResponse,
    CmsEntryDeleteMutationVariables,
    CmsEntryPublishMutationResponse,
    CmsEntryPublishMutationVariables,
    CmsEntryRequestChangesMutationResponse,
    CmsEntryRequestChangesMutationVariables,
    CmsEntryRequestReviewMutationResponse,
    CmsEntryRequestReviewMutationVariables,
    CmsEntryUnpublishMutationResponse,
    CmsEntryUnpublishMutationVariables
} from "~/admin/graphql/contentEntries";

interface CreateRevisionHandler {
    (): Promise<void>;
}
interface EditRevisionHandler {
    (): void;
}
interface DeleteRevisionHandler {
    (): Promise<void>;
}
interface PublishRevisionHandler {
    (): Promise<void>;
}
interface UnpublishRevisionHandler {
    (): Promise<void>;
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
    const { contentModel, entry, setLoading, listQueryVariables } = useContentEntry();

    const { history } = useRouter();
    const { showSnackbar } = useSnackbar();
    const client = useApolloClient();
    const { modelId } = contentModel;

    const {
        CREATE_REVISION,
        DELETE_REVISION,
        PUBLISH_REVISION,
        UNPUBLISH_REVISION,
        REQUEST_REVIEW,
        REQUEST_CHANGES
    } = useMemo(() => {
        return {
            CREATE_REVISION: GQL.createCreateFromMutation(contentModel),
            DELETE_REVISION: GQL.createDeleteMutation(contentModel),
            PUBLISH_REVISION: GQL.createPublishMutation(contentModel),
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
            createRevision: (): CreateRevisionHandler => async (): Promise<void> => {
                setLoading(true);
                const { data: res } = await client.mutate({
                    mutation: CREATE_REVISION,
                    variables: {
                        revision: revision.id
                    },
                    update(cache, { data }) {
                        const newRevision = data.content.data;

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

                const { data, error } = res.content;

                if (error) {
                    return showSnackbar(error.message);
                }

                history.push(`/cms/content-entries/${modelId}?id=${encodeURIComponent(data.id)}`);
            },
            editRevision: (): EditRevisionHandler => (): void => {
                history.push(
                    `/cms/content-entries/${modelId}/?id=${encodeURIComponent(revision.id)}`
                );
            },
            deleteRevision:
                ({ entry }): DeleteRevisionHandler =>
                async (): Promise<void> => {
                    setLoading(true);
                    await client.mutate<
                        CmsEntryDeleteMutationResponse,
                        CmsEntryDeleteMutationVariables
                    >({
                        mutation: DELETE_REVISION,
                        variables: {
                            revision: revision.id
                        },
                        update: (cache, { data }) => {
                            const { error } = data.content;
                            if (error) {
                                return showSnackbar(error.message);
                            }

                            // We have other revisions, update entry's cache
                            const revisions = GQLCache.removeRevisionFromEntryCache(
                                contentModel,
                                cache,
                                revision
                            );

                            if (revision.id === entry.id) {
                                GQLCache.updateLatestRevisionInListCache(
                                    contentModel,
                                    cache,
                                    revisions[0],
                                    listQueryVariables
                                );
                                // Redirect to the first revision in the list of all entry revisions.
                                return history.push(
                                    `/cms/content-entries/${modelId}?id=` +
                                        encodeURIComponent(revisions[0].id)
                                );
                            }
                        }
                    });

                    setLoading(false);
                },
            publishRevision: (): PublishRevisionHandler => async () => {
                setLoading(true);
                await client.mutate<
                    CmsEntryPublishMutationResponse,
                    CmsEntryPublishMutationVariables
                >({
                    mutation: PUBLISH_REVISION,
                    variables: { revision: revision.id },
                    update(cache, { data }) {
                        const { data: published, error } = data.content;
                        if (error) {
                            return showSnackbar(error.message);
                        }

                        GQLCache.unpublishPreviouslyPublishedRevision(
                            contentModel,
                            cache,
                            published.id
                        );

                        showSnackbar(
                            <span>
                                Successfully published revision{" "}
                                <strong>#{published.meta.version}</strong>!
                            </span>
                        );
                    }
                });

                setLoading(false);
            },
            unpublishRevision: (): UnpublishRevisionHandler => async (): Promise<void> => {
                setLoading(true);
                const { data } = await client.mutate<
                    CmsEntryUnpublishMutationResponse,
                    CmsEntryUnpublishMutationVariables
                >({
                    mutation: UNPUBLISH_REVISION,
                    variables: {
                        revision: revision.id
                    }
                });

                setLoading(false);

                const { error } = data.content;
                if (error) {
                    showSnackbar(error.message);
                    return;
                }

                showSnackbar(
                    <span>
                        Successfully unpublished revision <strong>#{revision.meta.version}</strong>!
                    </span>
                );
            },
            requestReview:
                (): RequestReviewHandler =>
                async (id?: string): Promise<void> => {
                    setLoading(true);
                    await client.mutate<
                        CmsEntryRequestReviewMutationResponse,
                        CmsEntryRequestReviewMutationVariables
                    >({
                        mutation: REQUEST_REVIEW,
                        variables: {
                            revision: id || revision.id
                        },
                        update(_, { data }) {
                            const { error } = data.content;
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
                async (id?: string): Promise<void> => {
                    setLoading(true);
                    await client.mutate<
                        CmsEntryRequestChangesMutationResponse,
                        CmsEntryRequestChangesMutationVariables
                    >({
                        mutation: REQUEST_CHANGES,
                        variables: {
                            revision: id || revision.id
                        },
                        update(_, { data }) {
                            const { error } = data.content;
                            if (error) {
                                return showSnackbar(error.message);
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
