import { useFeature } from "@webiny/app";
import { DeleteModelGroupFeature } from "~/features/modelGroup/deleteModelGroup/feature.js";

export const useDeleteModelGroup = () => {
    const { useCase } = useFeature(DeleteModelGroupFeature);

    return {
        deleteModelGroup: (id: string) => useCase.execute(id)
    };
};
