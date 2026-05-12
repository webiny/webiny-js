import { createFeature } from "@webiny/feature/api";
import { GetFileContentsByKeyUseCaseImplementation } from "./GetFileContentsByKeyUseCase.js";

export const GetFileContentsByKeyFeature = createFeature({
    name: "FileManagerS3/GetFileContentsByKey",
    register(container) {
        container.register(GetFileContentsByKeyUseCaseImplementation);
    }
});
