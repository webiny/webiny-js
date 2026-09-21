import { createFeature } from "@webiny/feature/api";
import { CreateMultiPartUploadUseCase } from "./CreateMultiPartUploadUseCase.js";

export const CreateMultiPartUploadFeature = createFeature({
    name: "FileManagerServer/CreateMultiPartUpload",
    register(container) {
        container.register(CreateMultiPartUploadUseCase);
    }
});
