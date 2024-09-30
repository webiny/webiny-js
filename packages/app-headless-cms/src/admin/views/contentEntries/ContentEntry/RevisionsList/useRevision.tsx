import React from "react";
import { useRouter } from "@webiny/react-router";
import { useHandlers } from "@webiny/app/hooks/useHandlers";
import { useSnackbar } from "@webiny/app-admin/hooks/useSnackbar";
import { CmsContentEntry } from "~/types";
import { useContentEntry } from "~/admin/views/contentEntries/hooks/useContentEntry";
import { PublishEntryRevisionResponse } from "~/admin/contexts/Cms";

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
    const { contentModel } = contentEntry;
    const { modelId } = contentModel;

    const { createRevision, editRevision, deleteRevision, publishRevision, unpublishRevision } =
        useHandlers<UseRevisionHandlers>(
            { entry: revision, contentEntryHook: contentEntry },
            {
                createRevision:
                    ({ contentEntryHook }): CreateRevisionHandler =>
                    async (id): Promise<void> => {
                        const { entry, error } = await contentEntryHook.createEntryRevisionFrom({
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
                    ({ entry, contentEntryHook }): DeleteRevisionHandler =>
                    async (id): Promise<void> => {
                        const revisionId = id || entry.id;

                        const response = await contentEntryHook.deleteEntryRevision({
                            id: revisionId
                        });

                        if (typeof response === "object" && response.error) {
                            return;
                        }

                        const { newLatestRevision } = response;

                        let redirectTarget = `/cms/content-entries/${modelId}`;
                        if (newLatestRevision) {
                            // Redirect to the first revision in the list of all entry revisions.
                            redirectTarget += `?id=${encodeURIComponent(newLatestRevision.id)}`;
                        }

                        history.push(redirectTarget);
                    },
                publishRevision:
                    ({ entry, contentEntryHook }): PublishRevisionHandler =>
                    async id => {
                        const response = await contentEntryHook.publishEntryRevision({
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
                    ({ entry, contentEntryHook }): UnpublishRevisionHandler =>
                    async id => {
                        const { error } = await contentEntryHook.unpublishEntryRevision({
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
