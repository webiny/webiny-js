import type { ApiCoreContext } from "@webiny/api-core/types/core.js";
import { ContextPlugin } from "@webiny/api";
import { setupAssetDelivery } from "./delivery/setupAssetDelivery.js";
import { createGraphQLSchemaPlugin } from "./graphql/index.js";
import { FileManagerFeature } from "~/features/FileManagerFeature.js";
import { FmPermissionsFeature } from "~/features/permissions/feature.js";
import { AiImageTaggingFeature } from "~/features/ai/AiImageTaggingFeature.js";
import { GetModelUseCase } from "@webiny/api-headless-cms/features/contentModel/GetModel/index.js";
import { FileModel as FileModelAbstraction } from "~/domain/file/abstractions.js";
import { TenantContext } from "@webiny/api-core/features/tenancy/TenantContext/index.js";
import { WcpContext } from "@webiny/api-core/features/wcp/WcpContext/index.js";
import { FileModel, FILE_MODEL_ID } from "~/domain/file/file.model.js";

export * from "./modelModifier/CmsModelModifier.js";
export * from "./delivery/index.js";

export const createFileManagerContext = () => {
    const plugin = new ContextPlugin<ApiCoreContext>(async context => {
        const tenantContext = context.container.resolve(TenantContext);
        const getModel = context.container.resolve(GetModelUseCase);

        if (!tenantContext.getTenant()) {
            return;
        }

        context.container.register(FileModel);

        await context.security.withoutAuthorization(async () => {
            const fileModel = await getModel.execute(FILE_MODEL_ID);
            context.container.registerInstance(FileModelAbstraction, fileModel.value);
        });

        FmPermissionsFeature.register(context.container);
        FileManagerFeature.register(context.container);

        const wcpContext = context.container.resolve(WcpContext);
        if (wcpContext.canUseAiImageEnrichment()) {
            AiImageTaggingFeature.register(context.container);
        }
    });

    plugin.name = "file-manager.createContext";

    return plugin;
};

export const createFileManagerGraphQL = () => {
    return createGraphQLSchemaPlugin();
};

export const createAssetDelivery = () => {
    return setupAssetDelivery();
};
