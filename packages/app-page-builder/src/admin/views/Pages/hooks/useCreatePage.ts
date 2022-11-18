import { useCallback } from "react";
import { useMutation } from "@apollo/react-hooks";
import { CREATE_PAGE } from "~/admin/graphql/pages";
import * as GQLCache from "~/admin/views/Pages/cache";
import { useSnackbar } from "@webiny/app-admin/hooks/useSnackbar";
import { useLinks } from "@webiny/app-folders";
import { useRouter } from "@webiny/react-router";
import { FOLDER_ID_DEFAULT } from "~/admin/constants/folders";

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
    folderId = FOLDER_ID_DEFAULT
}: UseCreatePageParams) => {
    const [create] = useMutation(CREATE_PAGE);
    const { createLink } = useLinks(folderId);
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
                await createLink({ id: data.pid, folderId });
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
