import { createFeature } from "@webiny/feature/api";
import { UploadSingleFileRoute } from "./UploadSingleFileRoute.js";
import { registerHttpRoute } from "@webiny/event-handler-core";

export const UploadSingleFileRouteFeature = createFeature({
    name: "FileManagerServer/UploadSingleFileRoute",
    register(container) {
        registerHttpRoute(container, UploadSingleFileRoute);
    }
});
