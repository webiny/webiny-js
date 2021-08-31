import { useCallback, useState } from "react";
import pick from "lodash/pick";
import { useMutation } from "@apollo/react-hooks";
import { useRouter } from "@webiny/react-router";
import { useSnackbar } from "@webiny/app-admin/hooks/useSnackbar";
import * as GQLCache from "~/admin/views/Pages/cache";
import { IMPORT_PAGE } from "~/admin/graphql/pages";

const useImportPage = ({ setLoadingLabel, clearLoadingLabel, closeDialog }) => {
    const [fileKey, setFileKey] = useState<string | null>(null);

    const [importPage] = useMutation(IMPORT_PAGE);
    const { showSnackbar } = useSnackbar();
    const { history } = useRouter();

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
                        if (data.pageBuilder.importPage.error) {
                            return;
                        }

                        GQLCache.addPageToListCache(cache, data.pageBuilder.importPage.data);
                    }
                });

                clearLoadingLabel();
                closeDialog();

                const { error, data } = res.data.pageBuilder.importPage;
                if (error) {
                    showSnackbar(error.message);
                } else {
                    history.push(`/page-builder/editor/${encodeURIComponent(data.id)}`);
                }
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
