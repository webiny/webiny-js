import { createFeature } from "@webiny/feature/api";
import { GetFileContentsUseCaseImplementation } from "./GetFileContentsUseCase.js";

export const GetFileContentsFeature = createFeature({
    name: "FileManagerS3/GetFileContents",
    register(container) {
        container.register(GetFileContentsUseCaseImplementation);
    }
});
