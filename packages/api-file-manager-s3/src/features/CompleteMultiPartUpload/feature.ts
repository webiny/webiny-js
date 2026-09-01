import { createFeature } from "@webiny/feature/api";
import { CompleteMultiPartUploadUseCaseImplementation } from "./CompleteMultiPartUploadUseCase.js";

export const CompleteMultiPartUploadFeature = createFeature({
    name: "FileManagerS3/CompleteMultiPartUpload",
    register(container) {
        container.register(CompleteMultiPartUploadUseCaseImplementation);
    }
});
