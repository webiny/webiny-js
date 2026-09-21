import { createFeature } from "@webiny/feature/api";
import { GetUploadPayloadUseCase } from "./GetUploadPayloadUseCase.js";

export const GetUploadPayloadFeature = createFeature({
    name: "FileManagerServer/GetUploadPayload",
    register(container) {
        container.register(GetUploadPayloadUseCase);
    }
});
