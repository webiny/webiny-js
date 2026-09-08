import { createFeature } from "@webiny/feature/api";
import { UploadSingleFileRouteDefinition } from "./UploadSingleFileRoute.js";
import { HttpRouteDefinition } from "@webiny/event-handler-core";

export const UploadSingleFileRouteFeature = createFeature({
    name: "FileManagerServer/UploadSingleFileRoute",
    register(container) {
        container.registerInstance(HttpRouteDefinition, UploadSingleFileRouteDefinition);
    }
});
