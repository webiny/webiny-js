import { createFeature } from "@webiny/feature/api";
import { UploadPartRoute } from "./UploadPartRoute.js";
import { registerHttpRoute } from "@webiny/event-handler-core";

export const UploadPartRouteFeature = createFeature({
    name: "FileManagerServer/UploadPartRoute",
    register(container) {
        registerHttpRoute(container, UploadPartRoute);
    }
});
