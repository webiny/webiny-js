import { createFeature } from "@webiny/feature/api";
import { CompleteMultiPartUploadUseCase } from "./CompleteMultiPartUploadUseCase.js";

export const CompleteMultiPartUploadFeature = createFeature({
    name: "FileManagerServer/CompleteMultiPartUpload",
    register(container) {
        container.register(CompleteMultiPartUploadUseCase);
    }
});
