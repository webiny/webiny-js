import { useCallback } from "react";
import { useMutation } from "@apollo/react-hooks";
import { CREATE_PAGE } from "~/admin/graphql/pages";
import * as GQLCache from "~/admin/views/Pages/cache";
import { useSnackbar } from "@webiny/app-admin/hooks/useSnackbar";
import { useRouter } from "@webiny/react-router";

interface UseCreatePageParams {
    setLoadingLabel: () => void;
    clearLoadingLabel: () => void;
    closeDialog: () => void;
    onCreatePageSuccess: (id: string) => void;
}
const useCreatePage = ({
    setLoadingLabel,
    clearLoadingLabel,
    closeDialog,
    onCreatePageSuccess
}: UseCreatePageParams) => {
    const [create] = useMutation(CREATE_PAGE);
    const { showSnackbar } = useSnackbar();
    const { history } = useRouter();

    const createPageMutation = useCallback(async ({ slug: category }) => {
        try {
            setLoadingLabel();
            const res = await create({
                variables: { category },
                update(cache, { data }) {
                    if (data.pageBuilder.createPage.error) {
                        return;
                    }

                    GQLCache.addPageToListCache(cache, data.pageBuilder.createPage.data);
                }
            });

            clearLoadingLabel();
            closeDialog();

            const { error, data } = res.data.pageBuilder.createPage;
            if (error) {
                showSnackbar(error.message);
            } else {
                // Create link to folder, in case is not defined, link to ROOT fake folder
                await onCreatePageSuccess(data.pid);
                history.push(`/page-builder/editor/${encodeURIComponent(data.id)}`);
            }
        } catch (e) {
            showSnackbar(e.message);
        }
    }, []);

    return {
        createPageMutation
    };
};
export default useCreatePage;
