import React, { useMemo } from "react";
import { useRouter } from "@webiny/react-router";
import { useHandlers } from "@webiny/app/hooks/useHandlers";
import { useSnackbar } from "@webiny/app-admin/hooks/useSnackbar";
import { CmsContentEntry } from "~/types";
import {
    CmsEntryCreateFromMutationResponse,
    CmsEntryCreateFromMutationVariables,
    createCreateFromMutation,
    createRevisionsQuery
} from "@webiny/app-headless-cms-common";
import { useApolloClient, useCms } from "~/admin/hooks";
import { useContentEntry } from "~/admin/views/contentEntries/hooks/useContentEntry";
import { getFetchPolicy } from "~/utils/getFetchPolicy";
import { useRecords } from "@webiny/app-aco";

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

interface UseRevisionHandlers {
    createRevision: CreateRevisionHandler;
    editRevision: EditRevisionHandler;
    deleteRevision: DeleteRevisionHandler;
    publishRevision: PublishRevisionHandler;
    unpublishRevision: UnpublishRevisionHandler;
}

export interface UseRevisionProps {
    revision: Pick<CmsContentEntry, "id"> & {
        meta: Pick<CmsContentEntry["meta"], "version">;
    };
}

export const useRevision = ({ revision }: UseRevisionProps) => {
    const { publishEntryRevision, unpublishEntryRevision, deleteEntry } = useCms();
    const { contentModel, entry, setLoading } = useContentEntry();

    const { history } = useRouter();
    const { showSnackbar } = useSnackbar();
    const client = useApolloClient();
    const { modelId } = contentModel;

    const { updateRecordInCache } = useRecords();

    const { CREATE_REVISION } = useMemo(() => {
        return {
            CREATE_REVISION: createCreateFromMutation(contentModel)
        };
    }, [modelId]);

    const { createRevision, editRevision, deleteRevision, publishRevision, unpublishRevision } =
        useHandlers<UseRevisionHandlers>(
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
                            fetchPolicy: getFetchPolicy(contentModel),
                            refetchQueries: [
                                {
                                    query: createRevisionsQuery(contentModel),
                                    variables: {
                                        id: entry.id
                                    }
                                }
                            ]
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

                        updateRecordInCache(data);

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
                            id: id || entry.id
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
                            entry,
                            id: id || entry.id
                        });

                        setLoading(false);

                        const { error, entry: entryResult } = response;
                        if (error) {
                            showSnackbar(error.message);
                            return;
                        }

                        updateRecordInCache(entryResult);

                        showSnackbar(
                            <span>
                                Successfully published revision{" "}
                                <strong>#{response.entry!.meta.version}</strong>!
                            </span>
                        );
                    },
                unpublishRevision:
                    ({ entry }): UnpublishRevisionHandler =>
                    async id => {
                        setLoading(true);

                        const response = await unpublishEntryRevision({
                            model: contentModel,
                            entry,
                            id: id || entry.id
                        });

                        setLoading(false);

                        const { error, entry: entryResult } = response;

                        if (error) {
                            showSnackbar(error.message);
                            return;
                        }

                        updateRecordInCache(entryResult);

                        showSnackbar(
                            <span>
                                Successfully unpublished revision{" "}
                                <strong>#{revision.meta.version}</strong>!
                            </span>
                        );
                    }
            }
        );

    return {
        createRevision,
        editRevision,
        deleteRevision,
        publishRevision,
        unpublishRevision
    };
};
