import { useCallback } from "react";
import { useApolloClient } from "@apollo/react-hooks";
import { useRouter } from "@webiny/react-router";
import { CREATE_PAGE, DELETE_PAGE } from "~/admin/graphql/pages";
import { usePublishRevisionHandler } from "./usePublishRevisionHandler";
import { useSnackbar } from "@webiny/app-admin/hooks/useSnackbar";
import * as GQLCache from "~/admin/views/Pages/cache";
import { PbPageData, PbPageRevision } from "~/types";

interface UseRevisionHandlersProps {
    page: PbPageData;
    revision: PbPageRevision;
}
export function useRevisionHandlers(props: UseRevisionHandlersProps) {
    const { showSnackbar } = useSnackbar();
    const { history } = useRouter();
    const client = useApolloClient();
    const { page, revision } = props;
    const { publishRevision, unpublishRevision } = usePublishRevisionHandler({ page });

    const createRevision = useCallback(async () => {
        const { data: res } = await client.mutate({
            mutation: CREATE_PAGE,
            variables: { from: revision.id },
            update(cache, { data }) {
                if (data.pageBuilder.createPage.error) {
                    return;
                }

                GQLCache.updateLatestRevisionInListCache(cache, data.pageBuilder.createPage.data);
            }
        });
        const { data, error } = res.pageBuilder.createPage;

        if (error) {
            return showSnackbar(error.message);
        }

        history.push(`/page-builder/editor/${encodeURIComponent(data.id)}`);
    }, [revision]);

    const editRevision = useCallback((): void => {
        history.push(`/page-builder/editor/${encodeURIComponent(revision.id)}`);
    }, [revision]);

    const deleteRevision = useCallback(async () => {
        const { data: res } = await client.mutate({
            mutation: DELETE_PAGE,
            variables: { id: revision.id },
            update(cache, response) {
                if (response.data.pageBuilder.deletePage.error) {
                    return;
                }

                // We have other revisions, update entry's cache
                const revisions = GQLCache.removeRevisionFromEntryCache(cache, revision);

                if (revision.id === page.id) {
                    GQLCache.updateLatestRevisionInListCache(cache, revisions[0]);
                    // Redirect to the first revision in the list of all entry revisions.
                    return history.push(
                        `/page-builder/pages?id=` + encodeURIComponent(revisions[0].id)
                    );
                }
            }
        });
        const { error } = res.pageBuilder.deletePage;
        if (error) {
            return showSnackbar(error.message);
        }
    }, [revision, page]);

    return {
        publishRevision,
        unpublishRevision,
        createRevision,
        editRevision,
        deleteRevision
    };
}
