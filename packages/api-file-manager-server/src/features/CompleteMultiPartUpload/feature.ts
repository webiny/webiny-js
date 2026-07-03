import { createFeature } from "@webiny/feature/api";
import { CompleteMultiPartUploadUseCaseImplementation } from "./CompleteMultiPartUploadUseCase.js";

export const CompleteMultiPartUploadFeature = createFeature({
    name: "FileManagerServer/CompleteMultiPartUpload",
    register(container) {
        container.register(CompleteMultiPartUploadUseCaseImplementation);
    }
});
