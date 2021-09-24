import { useCallback, useState } from "react";
import pick from "lodash/pick";
import get from "lodash/get";
import { useMutation } from "@apollo/react-hooks";
import { useSnackbar } from "@webiny/app-admin/hooks/useSnackbar";
import { IMPORT_PAGES } from "~/admin/graphql/pages";

const useImportPage = ({ setLoadingLabel, clearLoadingLabel, closeDialog }) => {
    const [fileKey, setFileKey] = useState<string | null>(null);

    const [importPage] = useMutation(IMPORT_PAGES);
    const { showSnackbar } = useSnackbar();

    const importPageMutation = useCallback(
        async ({ slug: category }) => {
            try {
                setLoadingLabel();
                const res = await importPage({
                    variables: {
                        category,
                        data: pick(
                            {
                                zipFileKey: fileKey,
                                zipFileUrl: fileKey
                            },
                            [fileKey.startsWith("http") ? "zipFileUrl" : "zipFileKey"]
                        )
                    },
                    update(cache, { data }) {
                        const { error } = get(data, "pageBuilder.importPages", {});
                        if (error) {
                            return;
                        }

                        // We won't have information about the pages, so we can't add them to the cache.
                        // GQLCache.addPageToListCache(cache, data.pageBuilder.importPage.data);
                    }
                });

                clearLoadingLabel();
                closeDialog();

                const { error, data } = get(res, "pageBuilder.importPages", {});
                if (error) {
                    showSnackbar(error.message);
                    return;
                }
                // TODO: Do the polling
                console.log(data);
            } catch (e) {
                showSnackbar(e.message);
            }
        },
        [fileKey]
    );

    const beforeOnImportPage = useCallback((key: string) => {
        setFileKey(key);
    }, []);

    return {
        importPageMutation,
        beforeOnImportPage
    };
};

export default useImportPage;
