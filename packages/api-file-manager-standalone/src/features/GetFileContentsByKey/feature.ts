import { createFeature } from "@webiny/feature/api";
import { GetFileContentsByKeyUseCase } from "./GetFileContentsByKeyUseCase.js";

export const GetFileContentsByKeyFeature = createFeature({
    name: "FileManagerServer/GetFileContentsByKey",
    register(container) {
        container.register(GetFileContentsByKeyUseCase);
    }
});
