import { useCallback } from "react";
import { useMutation } from "@apollo/react-hooks";
import { CREATE_PAGE } from "~/admin/graphql/pages";
import * as GQLCache from "~/admin/views/Pages/cache";
import { useSnackbar } from "@webiny/app-admin/hooks/useSnackbar";

interface UseCreatePageParams {
    setLoadingLabel: () => void;
    clearLoadingLabel: () => void;
    closeDialog: () => void;
    onCreatePageSuccess: (id: string) => Promise<void>;
}
const useCreatePage = ({
    setLoadingLabel,
    clearLoadingLabel,
    closeDialog,
    onCreatePageSuccess
}: UseCreatePageParams) => {
    const [create] = useMutation(CREATE_PAGE);
    const { showSnackbar } = useSnackbar();

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
                await onCreatePageSuccess(data.pid);
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
