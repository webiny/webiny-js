import { useRoute, useRouter } from "@webiny/app-admin";
import { useCallback } from "react";
import { Routes } from "~/routes.js";

export const useGoToRevision = () => {
    const { goToRoute } = useRouter();
    const { route } = useRoute(Routes.ContentEntries.List);

    const goToRevision = useCallback(
        (id: string) => {
            goToRoute(Routes.ContentEntries.List, {
                id,
                modelId: route.params.modelId,
                folderId: route.params.folderId
            });
        },
        [route]
    );

    return { goToRevision };
};
