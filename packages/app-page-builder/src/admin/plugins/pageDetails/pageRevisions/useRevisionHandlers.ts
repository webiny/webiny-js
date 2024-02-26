import { useCallback } from "react";
import { useApolloClient } from "@apollo/react-hooks";
import { useRouter } from "@webiny/react-router";
import { CREATE_PAGE } from "~/admin/graphql/pages";
import { usePublishRevisionHandler } from "./usePublishRevisionHandler";
import { useSnackbar } from "@webiny/app-admin/hooks/useSnackbar";
import * as GQLCache from "~/admin/views/Pages/cache";
import { useAdminPageBuilder } from "~/admin/hooks/useAdminPageBuilder";
import { PbPageData, PbPageRevision } from "~/types";
import { useNavigatePage } from "~/admin/hooks/useNavigatePage";
import { useRecords } from "@webiny/app-aco";

interface UseRevisionHandlersProps {
    page: PbPageData;
    revision: PbPageRevision;
}
export function useRevisionHandlers(props: UseRevisionHandlersProps) {
    const { showSnackbar } = useSnackbar();
    const { history } = useRouter();
    const client = useApolloClient();
    const { page, revision } = props;
    const { publishRevision, unpublishRevision } = usePublishRevisionHandler();
    const pageBuilder = useAdminPageBuilder();
    const { navigateToPageEditor } = useNavigatePage();
    const { getRecord } = useRecords();

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

        navigateToPageEditor(data.id);
    }, [revision, navigateToPageEditor]);

    const editRevision = useCallback((): void => {
        navigateToPageEditor(revision.id);
    }, [revision, navigateToPageEditor]);

    const deleteRevision = useCallback(async () => {
        const response = await pageBuilder.deletePage(revision, {
            client: pageBuilder.client,
            mutationOptions: {
                update(_, response) {
                    if (response.data.pageBuilder.deletePage.error) {
                        return;
                    }

                    // We have other revisions, update entry's cache
                    const revisions = GQLCache.removeRevisionFromEntryCache(
                        pageBuilder.client.cache,
                        revision
                    );

                    if (revision.id === page.id) {
                        GQLCache.updateLatestRevisionInListCache(
                            pageBuilder.client.cache,
                            revisions[0]
                        );
                        // Redirect to the first revision in the list of all entry revisions.
                        return history.push(
                            `/page-builder/pages?id=` + encodeURIComponent(revisions[0].id)
                        );
                    }
                }
            }
        });

        // Sync ACO record - retrieve the most updated record and update table
        await getRecord(page.pid);

        if (response) {
            const { error } = response;
            if (error) {
                return showSnackbar(error.message);
            }
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
