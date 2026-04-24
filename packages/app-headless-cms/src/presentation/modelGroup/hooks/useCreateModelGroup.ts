import { useFeature } from "@webiny/app";
import type { CreateModelGroupUseCase } from "~/features/modelGroup/createModelGroup/abstractions.js";
import { CreateModelGroupFeature } from "~/features/modelGroup/createModelGroup/feature.js";

export const useCreateModelGroup = () => {
    const { useCase } = useFeature(CreateModelGroupFeature);

    return {
        createModelGroup: (params: CreateModelGroupUseCase.Params) => useCase.execute(params)
    };
};
