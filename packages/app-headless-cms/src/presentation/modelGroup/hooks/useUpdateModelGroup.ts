import { useFeature } from "@webiny/app";
import type { UpdateModelGroupUseCase } from "~/features/modelGroup/updateModelGroup/abstractions.js";
import { UpdateModelGroupFeature } from "~/features/modelGroup/updateModelGroup/feature.js";

export const useUpdateModelGroup = () => {
    const { useCase } = useFeature(UpdateModelGroupFeature);

    return {
        updateModelGroup: (params: UpdateModelGroupUseCase.Params) => useCase.execute(params)
    };
};
