import { useCallback } from "react";
import { useApolloClient } from "react-apollo";
import { useRouter } from "@webiny/react-router";
import { CREATE_PAGE, DELETE_PAGE } from "@webiny/app-page-builder/admin/graphql/pages";
import { usePublishRevisionHandler } from "./usePublishRevisionHandler";
import { useSnackbar } from "@webiny/app-admin/hooks/useSnackbar";

export function useRevisionHandlers(props) {
    const { showSnackbar } = useSnackbar();
    const { history } = useRouter();
    const client = useApolloClient();
    const { page, revision } = props;
    const { publishRevision } = usePublishRevisionHandler({ page });

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
            variables: { id: revision.id }
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
        createRevision,
        editRevision,
        deleteRevision
    };
}
