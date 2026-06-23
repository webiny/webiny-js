import { type Container, createFeature } from "@webiny/feature/api";
import { registerLegacyPluginsViaGqlContextEnhancer } from "@webiny/handler-graphql";
import { createFileManagerContext } from "./index.js";
import { AssetDeliveryFeature } from "~/features/assetDelivery/feature.js";
import { AssetDeliveryRoute } from "./delivery/AssetDeliveryRoute.js";
import { FileModel } from "~/domain/file/file.model.js";

export const FileManagerAppFeature = createFeature({
    name: "FileManagerApp",
    register(container: Container) {
        // Register DI abstractions for asset delivery (resolvers, processor, output strategy)
        AssetDeliveryFeature.register(container);

        // Register asset delivery as a proper IHttpRoute (GET /files/*)
        container.register(AssetDeliveryRoute);

        // Register FileModel at register() time so GetModelUseCase.execute(FILE_MODEL_ID)
        // can find it during enhance() — registering only during enhance() arrives too late.
        container.register(FileModel);

        registerLegacyPluginsViaGqlContextEnhancer(container, [...createFileManagerContext()]);
    }
});
