import { useCallback } from "react";
import { useFeature } from "@webiny/app";
import { ListModelGroupsFeature } from "~/features/modelGroup/listModelGroups/feature.js";

export const useListModelGroups = () => {
    const { useCase } = useFeature(ListModelGroupsFeature);

    const listModelGroups = useCallback(() => {
        return useCase.execute();
    }, [useCase]);

    return {
        listModelGroups
    };
};
