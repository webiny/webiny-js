import { createFeature } from "@webiny/feature/api";
import { UploadFileUseCase } from "./UploadFileUseCase.js";

export const UploadFileFeature = createFeature({
    name: "FileManagerServer/UploadFile",
    register(container) {
        container.register(UploadFileUseCase);
    }
});
