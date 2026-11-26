import { createFeature } from "@webiny/feature/api";
import { UploadPartUseCase } from "./UploadPartUseCase.js";

export const UploadPartFeature = createFeature({
    name: "FileManagerServer/UploadPart",
    register(container) {
        container.register(UploadPartUseCase);
    }
});
