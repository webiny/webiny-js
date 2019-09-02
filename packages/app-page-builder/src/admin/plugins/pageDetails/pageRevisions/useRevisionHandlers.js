// @flow
import { useCallback } from "react";
import { useApolloClient } from "react-apollo";
import useReactRouter from "use-react-router";
import {
    createRevisionFrom,
    deleteRevision as deleteGql
} from "@webiny/app-page-builder/admin/graphql/pages";
import { usePublishRevisionHandler } from "../utils/usePublishRevisionHandler";
import { useSnackbar } from "@webiny/app-admin/components";
import { usePageDetails } from "@webiny/app-page-builder/admin/hooks/usePageDetails";

export function useRevisionHandlers({ rev }) {
    const { showSnackbar } = useSnackbar();
    const { history } = useReactRouter();
    const client = useApolloClient();
    const { page } = usePageDetails();
    const { publishRevision } = usePublishRevisionHandler({ page });

    const createRevision = useCallback(async () => {
        const { data: res } = await client.mutate({
            mutation: createRevisionFrom,
            variables: { revision: rev.id },
            refetchQueries: ["PbListPages"]
        });
        const { data, error } = res.pageBuilder.revision;

        if (error) {
            return showSnackbar(error.message);
        }

        history.push(`/page-builder/editor/${data.id}`);
    }, [rev]);

    const editRevision = useCallback(() => {
        history.push(`/page-builder/editor/${rev.id}`);
    }, [rev]);

    const deleteRevision = useCallback(async () => {
        const { data: res } = await client.mutate({
            mutation: deleteGql,
            refetchQueries: ["PbLoadPageRevisions"],
            variables: { id: rev.id }
        });
        const { error } = res.pageBuilder.deleteRevision;
        if (error) {
            return showSnackbar(error.message);
        }

        if (rev.id === page.id) {
            history.push("/page-builder/pages");
        }
    }, [rev, page]);

    return {
        publishRevision,
        createRevision,
        editRevision,
        deleteRevision
    };
}
