import { useCallback } from "react";
import type { GetPageParams } from "~/features/pages/getPage/IGetPageUseCase.js";
import { useGetPageGatewayInstance } from "~/features/pages/getPage/useGetPageGatewayInstance.js";

export const useGetPage = () => {
    const instance = useGetPageGatewayInstance([
        "properties",
        "metadata",
        "bindings",
        "elements",
        "extensions"
    ]);

    const getPage = useCallback(
        (params: GetPageParams) => {
            return instance.useCase.execute(params);
        },
        [instance]
    );

    return {
        getPage
    };
};
