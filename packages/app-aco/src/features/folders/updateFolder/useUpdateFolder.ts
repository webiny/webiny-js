import { useCallback, useEffect, useState } from "react";
import { autorun } from "mobx";
import { useFeature } from "@webiny/app";
import { UpdateFolderFeature } from "./feature.js";
import { UpdateFolderParams } from "./abstractions.js";

export const useUpdateFolder = () => {
    const { useCase, loading: loadingState } = useFeature(UpdateFolderFeature);

    const [loading, setLoading] = useState<boolean>(false);

    const updateFolder = useCallback(
        (folder: UpdateFolderParams) => {
            return useCase.execute(folder);
        },
        [useCase]
    );

    useEffect(() => {
        return autorun(() => {
            const isLoading = loadingState.isLoading("update");
            setLoading(isLoading);
        });
    }, [loadingState]);

    return {
        updateFolder,
        loading
    };
};
