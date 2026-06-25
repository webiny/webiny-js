import { createFeature } from "@webiny/feature/api";
import { CreateMultiPartUploadUseCaseImplementation } from "./CreateMultiPartUploadUseCase.js";

export const CreateMultiPartUploadFeature = createFeature({
    name: "FileManagerServer/CreateMultiPartUpload",
    register(container) {
        container.register(CreateMultiPartUploadUseCaseImplementation);
    }
});
