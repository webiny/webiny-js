import { createFeature } from "@webiny/feature/api";
import { UploadPartRouteDefinition } from "./UploadPartRoute.js";

export const UploadPartRouteFeature = createFeature({
    name: "FileManagerServer/UploadPartRoute",
    register(container) {
        container.register(UploadPartRouteDefinition);
    }
});
