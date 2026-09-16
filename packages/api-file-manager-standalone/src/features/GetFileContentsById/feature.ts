import { createFeature } from "@webiny/feature/api";
import { GetFileContentsByIdUseCase } from "./GetFileContentsByIdUseCase.js";

export const GetFileContentsByIdFeature = createFeature({
    name: "FileManagerServer/GetFileContentsById",
    register(container) {
        container.register(GetFileContentsByIdUseCase);
    }
});
