import { useFeature } from "@webiny/app";
import { DeleteFolderFeature } from "./feature.js";

export const useDeleteFolder = () => {
    const { useCase } = useFeature(DeleteFolderFeature);

    return {
        deleteFolder: (id: string) => {
            return useCase.execute(id);
        }
    };
};
