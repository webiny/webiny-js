import { createFeature } from "@webiny/feature/api";
import { CreateMultiPartUploadUseCaseImplementation } from "./CreateMultiPartUploadUseCase.js";

export const CreateMultiPartUploadFeature = createFeature({
    name: "FileManagerS3/CreateMultiPartUpload",
    register(container) {
        container.register(CreateMultiPartUploadUseCaseImplementation);
    }
});
