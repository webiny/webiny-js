import { useCallback } from "react";
import { LoadPages } from "~/features/pages/loadPages/LoadPages.js";
import type { LoadPagesUseCaseParams } from "~/features/pages/loadPages/ILoadPagesUseCase.js";
import { useListPagesGateway } from "~/features/pages/loadPages/useListPagesGateway.js";

export const useLoadPages = () => {
    const gateway = useListPagesGateway(["properties", "metadata"]);

    const loadPages = useCallback(
        (params: LoadPagesUseCaseParams) => {
            const instance = LoadPages.getInstance(gateway);
            return instance.execute(params);
        },
        [gateway]
    );

    return {
        loadPages
    };
};
