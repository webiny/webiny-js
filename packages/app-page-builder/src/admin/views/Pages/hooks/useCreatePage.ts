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
    const { history } = useRouter();
    const { showSnackbar } = useSnackbar();

    const createPageMutation = useCallback(
        async ({ slug: category }) => {
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
                    /**
                     * We create a new folder link to bind the page with the source folder.
                     */
                    await createLink({ id: data.pid, folderId });
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
