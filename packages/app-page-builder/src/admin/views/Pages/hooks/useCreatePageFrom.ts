import { useCallback, useState } from "react";
import { useMutation } from "@apollo/react-hooks";
import { useSnackbar } from "@webiny/app-admin";
import { CREATE_PAGE } from "~/admin/graphql/pages";
import * as GQLCache from "~/admin/views/Pages/cache";

import { PbPageDataItem, PbPageRevision } from "~/types";

interface UseEditPageParams {
    page: PbPageDataItem;
    onSuccess?: (data: PbPageRevision) => void;
}

export const useCreatePageFrom = ({ page, onSuccess }: UseEditPageParams) => {
    const [loading, setLoading] = useState<boolean>();
    const [createPageFrom] = useMutation(CREATE_PAGE);
    const { showSnackbar } = useSnackbar();

    const createPageFromMutation = useCallback(async () => {
        setLoading(true);

        const response = await createPageFrom({
            variables: { from: page.id },
            update(cache, { data }) {
                if (data.pageBuilder.createPage.error) {
                    return;
                }

                GQLCache.updateLatestRevisionInListCache(cache, data.pageBuilder.createPage.data);
            }
        });
        setLoading(false);

        const { data, error } = response.data.pageBuilder.createPage;
        if (error) {
            return showSnackbar(error.message);
        }

        if (typeof onSuccess === "function") {
            onSuccess(data);
        }
    }, [page, onSuccess]);

    return {
        createPageFromMutation,
        loading
    };
};
