import { createFeature } from "@webiny/feature/api";
import { UploadPartRoute, UploadPartRouteDefinition } from "./UploadPartRoute.js";
import { HttpRouteDefinition } from "@webiny/event-handler-core";

export const UploadPartRouteFeature = createFeature({
    name: "FileManagerServer/UploadPartRoute",
    register(container) {
        container.register(UploadPartRoute);
        container.registerInstance(HttpRouteDefinition, UploadPartRouteDefinition);
    }
});
