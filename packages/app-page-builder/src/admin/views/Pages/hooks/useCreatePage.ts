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
    folderId?: string;
}
const useCreatePage = ({
    setLoadingLabel,
    clearLoadingLabel,
    closeDialog,
    folderId
}: UseCreatePageParams) => {
    const [create] = useMutation(CREATE_PAGE);
    const { history } = useRouter();
    const { showSnackbar } = useSnackbar();

    const createPageMutation = useCallback(
        async ({ slug: category }) => {
            try {
                setLoadingLabel();
                const res = await create({
                    variables: { category, folderId },
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
                    history.push(`/page-builder/editor/${encodeURIComponent(data.id)}`);
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
