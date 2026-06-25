import { ServiceDiscovery } from "@webiny/api-core/features/serviceDiscovery/index.js";
import { DdbServiceManifestLoader } from "./serviceDiscovery/index.js";
import { DynamoDBClient } from "@webiny/db-dynamodb/features/DynamoDBClient/abstractions.js";
import { createRegisterExtensionPlugin } from "@webiny/handler";
import { TenancyApiCoreDdbFeature } from "~/tenancy/feature.js";
import { AdminUsersApiCoreDdbFeature } from "~/adminUsers/feature.js";
import { SecurityApiCoreDdbFeature } from "~/security/feature.js";
import { KeyValueStoreApiCoreDdbFeature } from "~/keyValueStore/feature.js";

export const createApiCoreDdb = () => {
    return createRegisterExtensionPlugin(context => {
        const documentClient = context.container.resolve(DynamoDBClient);
        ServiceDiscovery.setLoader(new DdbServiceManifestLoader(documentClient.client));
        TenancyApiCoreDdbFeature.register(context.container);
        AdminUsersApiCoreDdbFeature.register(context.container);
        SecurityApiCoreDdbFeature.register(context.container);
        KeyValueStoreApiCoreDdbFeature.register(context.container);
    });
};
