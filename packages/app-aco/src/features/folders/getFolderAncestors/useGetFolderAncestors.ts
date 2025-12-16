import { useFeature } from "@webiny/app";
import { GetFolderAncestorsFeature } from "./feature.js";

export const useGetFolderAncestors = () => {
    const { useCase } = useFeature(GetFolderAncestorsFeature);

    return {
        getFolderAncestors: (id: string) => {
            return useCase.execute(id);
        }
    };
};
