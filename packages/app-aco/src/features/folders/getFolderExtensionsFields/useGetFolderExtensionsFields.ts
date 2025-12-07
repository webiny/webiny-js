import { useFeature } from "@webiny/app";
import { GetFolderExtensionsFieldsFeature } from "./feature.js";

export const useGetFolderExtensionsFields = () => {
    const { useCase } = useFeature(GetFolderExtensionsFieldsFeature);

    return {
        getFolderExtensionsFields: () => {
            return useCase.execute();
        }
    };
};
