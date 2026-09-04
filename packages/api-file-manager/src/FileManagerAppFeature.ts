import { type Container, createFeature } from "@webiny/feature/api";
import { AssetDeliveryFeature } from "~/features/assetDelivery/feature.js";
import { AssetDeliveryRoute } from "./delivery/AssetDeliveryRoute.js";
import { FileModel } from "~/domain/file/file.model.js";
import { FmPermissionsFeature } from "~/features/permissions/feature.js";
import { FileManagerFeature } from "~/features/FileManagerFeature.js";
import { FileModelProvider } from "~/features/file/FileModelProvider.js";

export const FileManagerAppFeature = createFeature({
    name: "FileManagerApp",
    register(container: Container) {
        AssetDeliveryFeature.register(container);
        container.register(AssetDeliveryRoute);
        container.register(FileModel);
        FmPermissionsFeature.register(container);
        FileManagerFeature.register(container);

        // Stateless — the model list is already cached per request by the CMS (`ModelCache`), so the
        // provider holds nothing and needs no lifetime of its own.
        container.register(FileModelProvider);
    }
});
