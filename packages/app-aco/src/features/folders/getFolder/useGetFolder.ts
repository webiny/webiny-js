import { useFeature } from "@webiny/app";
import { GetFolderFeature } from "./feature.js";

export const useGetFolder = () => {
    const { useCase } = useFeature(GetFolderFeature);

    return {
        getFolder: (id: string) => {
            return useCase.execute(id);
        }
    };
};
