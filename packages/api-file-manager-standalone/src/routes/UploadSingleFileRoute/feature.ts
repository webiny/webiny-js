import { createFeature } from "@webiny/feature/api";
import { UploadSingleFileRouteDefinition } from "./UploadSingleFileRoute.js";

export const UploadSingleFileRouteFeature = createFeature({
    name: "FileManagerServer/UploadSingleFileRoute",
    register(container) {
        container.register(UploadSingleFileRouteDefinition);
    }
});
