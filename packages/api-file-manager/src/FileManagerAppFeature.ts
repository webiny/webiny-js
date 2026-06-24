import { type Container, createFeature } from "@webiny/feature/api";
import { AssetDeliveryFeature } from "~/features/assetDelivery/feature.js";
import { AssetDeliveryRoute } from "./delivery/AssetDeliveryRoute.js";
import { FileModel } from "~/domain/file/file.model.js";
import { FmPermissionsFeature } from "~/features/permissions/feature.js";
import { FileManagerFeature } from "~/features/FileManagerFeature.js";
import { FileModelContextualSchema } from "~/features/FileModelContextualSchema.js";

export const FileManagerAppFeature = createFeature({
    name: "FileManagerApp",
    register(container: Container) {
        AssetDeliveryFeature.register(container);
        container.register(AssetDeliveryRoute);
        container.register(FileModel);
        FmPermissionsFeature.register(container);
        FileManagerFeature.register(container);
        container.register(FileModelContextualSchema);
    }
});
