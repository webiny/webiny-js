import { useFeature } from "@webiny/app";
import { GetModelGroupFeature } from "~/features/modelGroup/getModelGroup/feature.js";

export const useGetModelGroup = () => {
    const { useCase } = useFeature(GetModelGroupFeature);

    return {
        getModelGroup: (id: string) => useCase.execute(id)
    };
};
