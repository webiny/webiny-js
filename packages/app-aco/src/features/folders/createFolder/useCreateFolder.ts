import { useFeature } from "@webiny/app";
import { CreateFolderUseCase } from "~/features/folders/createFolder/abstractions.js";
import { CreateFolderFeature } from "./feature.js";

export const useCreateFolder = () => {
    const { useCase } = useFeature(CreateFolderFeature);

    return {
        createFolder: (folder: CreateFolderUseCase.Params) => {
            return useCase.execute(folder);
        }
    };
};
