import { ServiceDiscovery } from "@webiny/api";
import { DynamoDBDocument } from "@webiny/aws-sdk/client-dynamodb";
import type { ApwContext } from "~/types.js";

export const getAppUrl = async (context: Pick<ApwContext, "db">) => {
    const client = context.db.driver.getClient() as DynamoDBDocument;
    ServiceDiscovery.setDocumentClient(client);
    const manifest = await ServiceDiscovery.load();
    if (!manifest) {
        return null;
    }
    return manifest.admin?.cloudfront?.domainName;
};
