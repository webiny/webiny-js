import { useCallback } from "react";
import { useApolloClient } from "@apollo/react-hooks";
import { CREATE_PAGE, CREATE_PAGE_FROM_TEMPLATE } from "~/admin/graphql/pages";
import * as GQLCache from "~/admin/views/Pages/cache";
import { useSnackbar } from "@webiny/app-admin/hooks/useSnackbar";
import { useRouter } from "@webiny/react-router";
import { useRecords } from "@webiny/app-aco";
import { PbPageTemplate } from "~/types";

interface UseCreatePageParams {
    setLoading: () => void;
    clearLoading: () => void;
    closeDialog: () => void;
    folderId?: string;
}
const useCreatePage = ({
    setLoading,
    clearLoading,
    closeDialog,
    folderId
}: UseCreatePageParams) => {
    const client = useApolloClient();
    const { history } = useRouter();
    const { showSnackbar } = useSnackbar();
    const { getRecord } = useRecords();

    const createPageMutation = useCallback(
        async (template?: PbPageTemplate) => {
            try {
                const MUTATION = template ? CREATE_PAGE_FROM_TEMPLATE : CREATE_PAGE;

                const variables = {
                    // category is temporarily hardcoded
                    category: "static",
                    templateId: template?.id,
                    meta: {
                        location: {
                            folderId
                        }
                    }
                };
                setLoading();
                const res = await client.mutate({
                    mutation: MUTATION,
                    variables,
                    update(cache, { data }) {
                        if (data.pageBuilder.createPage.error) {
                            return;
                        }

                        GQLCache.addPageToListCache(cache, data.pageBuilder.createPage.data);
                    }
                });

                clearLoading();
                closeDialog();

                const { error, data } = res.data.pageBuilder.createPage;
                if (error) {
                    showSnackbar(error.message);
                } else {
                    history.push(`/page-builder/editor/${encodeURIComponent(data.id)}`);
                    await getRecord(data.pid);
                }
            } catch (e) {
                showSnackbar(e.message);
            }
        },
        [folderId]
    );

    return {
        createPageMutation
    };
};
export default useCreatePage;
