import { createFeature } from "@webiny/feature/api";
import { GetFileByUrlUseCase } from "./GetFileByUrlUseCase.js";

export const GetFileByUrlFeature = createFeature({
    name: "FileManager/GetFileByUrl",
    register(container) {
        container.register(GetFileByUrlUseCase);
    }
});
