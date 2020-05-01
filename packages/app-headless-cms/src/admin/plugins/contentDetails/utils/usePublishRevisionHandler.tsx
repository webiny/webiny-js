import React, { useCallback, useMemo } from "react";
import { useSnackbar } from "@webiny/app-admin/hooks/useSnackbar";
import { createPublishMutation, createReadQuery } from "@webiny/app-headless-cms/admin/components/ContentModelForm/graphql";
import { useMutation } from "@webiny/app-headless-cms/admin/hooks";
import get from "lodash.get";
import set from "lodash.set";
import { i18n } from "@webiny/app/i18n";
const t = i18n.ns("app-headless-cms/admin/plugins/content-details");

export function usePublishRevisionHandler({ contentModel }: any) {
    const { showSnackbar } = useSnackbar();

    const PUBLISH_CONTENT = useMemo(() => {
        return createPublishMutation(contentModel);
    }, [contentModel.modelId]);

    const READ_CONTENT = useMemo(() => {
        return createReadQuery(contentModel);
    }, [contentModel.modelId]);

    const [publishContentMutation] = useMutation(PUBLISH_CONTENT);

    const onPublish = useCallback(
        async revision => {
            // setLoading(true);
            const response = await publishContentMutation({
                variables: { revision: revision.id }
            });

            const content = get(response, "data.content");
            // setLoading(false);
            if (content.error) {
                return showSnackbar(content.error.message);
            }

            showSnackbar(t`Content published successfully.`);
        },
        [contentModel.id]
    );

    const publishRevision = async revision => {
        /*const { data: res } = await client.mutate({
            mutation: PUBLISH_REVISION,
            variables: { id: revision.id },
            refetchQueries: ["PbListPages"],
            update: (cache, { data }) => {
                // Don't do anything if there was an error during publishing!
                if (data.pageBuilder.publishRevision.error) {
                    return;
                }

                const getPageQuery = READ_CONTENT();

                // Update revisions
                const pageFromCache = cache.readQuery({
                    query: getPageQuery,
                    variables: { id: content.id }
                });

                content.revisions.forEach(r => {
                    // Update published/locked fields on the revision that was just published.
                    if (r.id === revision.id) {
                        r.published = true;
                        r.locked = true;
                        return;
                    }

                    // Unpublish other published revisions
                    if (r.published) {
                        r.published = false;
                    }
                });

                // Write our data back to the cache.
                cache.writeQuery({
                    query: getPageQuery,
                    data: set(pageFromCache, "pageBuilder.page.data", content)
                });
            }
        });

        const { error } = res.pageBuilder.publishRevision;
        if (error) {
            return showSnackbar(error.message);
        }*/

        showSnackbar(
            <span>
                Successfully published revision <strong>#{revision.version}</strong>!
            </span>
        );
    };

    return {
        publishRevision
    };
}
