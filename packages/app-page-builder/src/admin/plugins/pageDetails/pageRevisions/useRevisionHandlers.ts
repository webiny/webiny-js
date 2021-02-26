import { useCallback } from "react";
import { useApolloClient } from "@apollo/react-hooks";
import { useRouter } from "@webiny/react-router";
import { CREATE_PAGE, DELETE_PAGE, LIST_PAGES } from "../../../graphql/pages";
import { usePublishRevisionHandler } from "./usePublishRevisionHandler";
import { useSnackbar } from "@webiny/app-admin/hooks/useSnackbar";
import cloneDeep from "lodash/cloneDeep";

export function useRevisionHandlers(props) {
    const { showSnackbar } = useSnackbar();
    const { history } = useRouter();
    const client = useApolloClient();
    const { page, revision } = props;
    const { publishRevision, unpublishRevision } = usePublishRevisionHandler({ page });

    const createRevision = useCallback(async () => {
        const { data: res } = await client.mutate({
            mutation: CREATE_PAGE,
            variables: { from: revision.id }
        });
        const { data, error } = res.pageBuilder.createPage;

        if (error) {
            return showSnackbar(error.message);
        }

        history.push(`/page-builder/editor/${encodeURIComponent(data.id)}`);
    }, [revision]);

    const editRevision = useCallback(() => {
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

                let variables;

                try {
                    variables = JSON.parse(
                        localStorage.getItem("wby_pb_pages_list_latest_variables")
                    );
                } catch {}

                if (!variables) {
                    return;
                }

                const data = cloneDeep(
                    cache.readQuery<Record<string, any>>({ query: LIST_PAGES, variables })
                );

                data.pageBuilder.listPages.data = data.pageBuilder.listPages.data.filter(
                    item => item.id !== page.id
                );

                cache.writeQuery({
                    query: LIST_PAGES,
                    variables,
                    data
                });
            }
        });
        const { error } = res.pageBuilder.deletePage;
        if (error) {
            return showSnackbar(error.message);
        }

        if (revision.id === page.id) {
            history.push("/page-builder/pages");
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
