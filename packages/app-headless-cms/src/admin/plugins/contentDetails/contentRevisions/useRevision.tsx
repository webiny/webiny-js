import React, { useMemo } from "react";
import { useRouter } from "@webiny/react-router";
import { useHandlers } from "@webiny/app/hooks/useHandlers";
import { useSnackbar } from "@webiny/app-admin/hooks/useSnackbar";
import { CmsEditorContentEntry, CmsEditorContentModel } from "@webiny/app-headless-cms/types";
import * as GQL from "../../../views/components/ContentModelForm/graphql";
import * as GQLCache from "../cache";
import { useApolloClient } from "../../../hooks";

export type UseRevisionProps = {
    contentModel: CmsEditorContentModel;
    revision: CmsEditorContentEntry;
    entry: CmsEditorContentEntry;
    setLoading: (loading: boolean) => void;
};

export const useRevision = ({ contentModel, revision, entry, setLoading }: UseRevisionProps) => {
    const { history } = useRouter();
    const { showSnackbar } = useSnackbar();
    const client = useApolloClient();
    const { modelId } = contentModel;

    const { CREATE_REVISION, DELETE_REVISION, PUBLISH_REVISION } = useMemo(() => {
        return {
            CREATE_REVISION: GQL.createCreateFromMutation(contentModel),
            DELETE_REVISION: GQL.createDeleteMutation(contentModel),
            PUBLISH_REVISION: GQL.createPublishMutation(contentModel)
        };
    }, [modelId]);

    const { createRevision, editRevision, deleteRevision, publishRevision } = useHandlers(null, {
        createRevision: () => async () => {
            setLoading(true);
            const { data: res } = await client.mutate({
                mutation: CREATE_REVISION,
                variables: { revision: revision.id },
                update(cache, { data }) {
                    GQLCache.updateLatestRevisionInListCache(
                        contentModel,
                        cache,
                        data.content.data
                    );
                }
            });

            setLoading(false);

            const { data, error } = res.content;

            if (error) {
                return showSnackbar(error.message);
            }

            history.push(`/cms/content-entries/${modelId}?id=${encodeURIComponent(data.id)}`);
        },
        editRevision: () => () => {
            history.push(`/cms/content-entries/${modelId}/?id=${encodeURIComponent(revision.id)}`);
        },
        deleteRevision: () => async () => {
            setLoading(true);
            await client.mutate({
                mutation: DELETE_REVISION,
                variables: { revision: revision.id },
                update: (cache, { data }) => {
                    const { error } = data.content;
                    if (error) {
                        return showSnackbar(error.message);
                    }

                    // We have other revisions, update entry's cache
                    const revisions = GQLCache.removeRevisionFromEntryCache(
                        contentModel,
                        cache,
                        entry,
                        revision
                    );

                    if (revision.id === entry.id) {
                        GQLCache.updateLatestRevisionInListCache(contentModel, cache, revisions[0]);
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
        publishRevision: () => async () => {
            setLoading(true);
            const { data } = await client.mutate({
                mutation: PUBLISH_REVISION,
                variables: { revision: revision.id }
            });

            setLoading(false);

            const { error } = data.content;
            if (error) {
                return showSnackbar(error.message);
            }

            showSnackbar(
                <span>
                    Successfully published revision <strong>#{revision.version}</strong>!
                </span>
            );
        }
        // unpublishRevision: () => async () => {
        //     await client.mutate({
        //         mutation: UNPUBLISH_REVISION,
        //         variables: { id: revision.id }
        //     });
        // }
    });

    return { createRevision, editRevision, deleteRevision, publishRevision };
};
