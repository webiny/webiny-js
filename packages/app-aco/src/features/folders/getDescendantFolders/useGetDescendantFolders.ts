import { useFeature } from "@webiny/app";
import { GetDescendantFoldersFeature } from "./feature.js";

export const useGetDescendantFolders = () => {
    const { useCase } = useFeature(GetDescendantFoldersFeature);

    return {
        getDescendantFolders: (id: string) => {
            return useCase.execute(id);
        }
    };
};
