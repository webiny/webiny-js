import { createFeature } from "@webiny/feature/api";
import { UploadPartRouteDefinition } from "./UploadPartRoute.js";
import { HttpRouteDefinition } from "@webiny/event-handler-core";

export const UploadPartRouteFeature = createFeature({
    name: "FileManagerServer/UploadPartRoute",
    register(container) {
        container.registerInstance(HttpRouteDefinition, UploadPartRouteDefinition);
    }
});
