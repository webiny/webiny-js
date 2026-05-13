import { createFeature } from "@webiny/feature/api";
import { GetFileContentsByIdUseCaseImplementation } from "./GetFileContentsByIdUseCase.js";

export const GetFileContentsByIdFeature = createFeature({
    name: "FileManagerS3/GetFileContentsById",
    register(container) {
        container.register(GetFileContentsByIdUseCaseImplementation);
    }
});
