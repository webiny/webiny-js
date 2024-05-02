import { useRouter } from "@webiny/react-router";
import { useCallback } from "react";
import { useModel } from "~/admin/hooks";

export const useGoToRevision = () => {
    const { model } = useModel();
    const { history, search } = useRouter();

    const goToRevision = useCallback(
        id => {
            const fId = search[0].get("folderId");
            const folderId = fId ? `&folderId=${encodeURIComponent(fId)}` : "";
            history.push(
                `/cms/content-entries/${model.modelId}?id=${encodeURIComponent(id)}${folderId}`
            );
        },
        [search[0]]
    );

    return { goToRevision };
};
