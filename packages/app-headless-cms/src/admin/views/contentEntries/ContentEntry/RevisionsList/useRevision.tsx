import React from "react";
import { useRouter } from "@webiny/react-router";
import { useHandlers } from "@webiny/app/hooks/useHandlers";
import { useSnackbar } from "@webiny/app-admin/hooks/useSnackbar";
import { CmsContentEntry } from "~/types";
import { useContentEntry } from "~/admin/views/contentEntries/hooks/useContentEntry";
import { PublishEntryRevisionResponse } from "~/admin/contexts/Cms";
import { RevisionDeletedSnackbarMessage } from "./RevisionDeletedSnackbarMessage";
import { useRecords } from "@webiny/app-aco";

export interface CreateRevisionHandler {
    (id?: string): Promise<void>;
}

export interface EditRevisionHandler {
    (id?: string): void;
}

export interface DeleteRevisionHandler {
    (id?: string): Promise<void>;
}

export interface PublishRevisionHandler {
    (id?: string): Promise<PublishEntryRevisionResponse>;
}

export interface UnpublishRevisionHandler {
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
    const contentEntry = useContentEntry();
    const { history } = useRouter();
    const { showSnackbar } = useSnackbar();
    const { updateRecordInCache, removeRecordFromCache } = useRecords();

    const { contentModel } = contentEntry;
    const { modelId } = contentModel;

    const { createRevision, editRevision, deleteRevision, publishRevision, unpublishRevision } =
        useHandlers<UseRevisionHandlers>(
            { entry: revision },
            {
                createRevision:
                    (): CreateRevisionHandler =>
                    async (id): Promise<void> => {
                        const { entry, error } = await contentEntry.createEntryRevisionFrom({
                            id: id || revision.id
                        });

                        if (error) {
                            showSnackbar(error.message);
                            return;
                        }

                        history.push(
                            `/cms/content-entries/${modelId}?id=${encodeURIComponent(entry.id)}`
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
                        const revisionId = id || entry.id;
                        const response = await contentEntry.deleteEntryRevision({
                            id: revisionId
                        });

                        if (typeof response === "object") {
                            return showSnackbar(response.error.message);
                        }

                        // In this case, `response` is a boolean value, indicating whether the revision
                        // was successfully deleted or not. If `response` is `false`, it means that the
                        // revision was not deleted, and we need to show a snackbar message to the user.
                        if (!response) {
                            showSnackbar(
                                <span>
                                    An error occurred while deleting revision entry&nbsp;
                                    <strong>#{entry.meta.version}</strong>!
                                </span>
                            );
                            return;
                        }

                        // The `revisions` array contains all revisions of the entry, ordered from the
                        // latest to the oldest. The first element in the array is the latest revision.
                        const newLatestRevision = contentEntry.revisions.find(
                            revision => revision.meta.version !== entry.meta.version
                        );

                        // 1. Update ACO cache.
                        if (newLatestRevision) {
                            // Make sure the new latest revision is in the cache. This is important because
                            // this way we get to see the change in the ACO entry list.
                            updateRecordInCache(newLatestRevision);
                        } else {
                            // Like in the above case, we need to remove the entry from the cache. And again,
                            // this is important because this way we get to see the change in the ACO entry list.
                            removeRecordFromCache(entry.id);
                        }

                        // 2. Show a snackbar message.
                        showSnackbar(
                            <RevisionDeletedSnackbarMessage
                                deletedRevision={entry}
                                newLatestRevision={newLatestRevision}
                            />
                        );

                        // 3. Redirect to the new latest revision or the list of all revisions.
                        let redirectTarget = `/cms/content-entries/${modelId}`;
                        if (newLatestRevision) {
                            // Redirect to the first revision in the list of all entry revisions.
                            redirectTarget += `?id=${encodeURIComponent(newLatestRevision.id)}`;
                        }

                        history.push(redirectTarget);
                    },
                publishRevision:
                    ({ entry }): PublishRevisionHandler =>
                    async id => {
                        const response = await contentEntry.publishEntryRevision({
                            id: id || entry.id
                        });

                        if (response.error) {
                            showSnackbar(response.error.message);
                            return response;
                        }

                        showSnackbar(
                            <span>
                                Successfully published revision{" "}
                                <strong>#{response.entry.meta.version}</strong>!
                            </span>
                        );

                        return response;
                    },
                unpublishRevision:
                    ({ entry }): UnpublishRevisionHandler =>
                    async id => {
                        const { error } = await contentEntry.unpublishEntryRevision({
                            id: id || entry.id
                        });

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
