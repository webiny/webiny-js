import { createFeature } from "@webiny/feature/api";
import { GetUploadPayloadUseCaseImplementation } from "./GetUploadPayloadUseCase.js";

export const GetUploadPayloadFeature = createFeature({
    name: "FileManagerServer/GetUploadPayload",
    register(container) {
        container.register(GetUploadPayloadUseCaseImplementation);
    }
});
