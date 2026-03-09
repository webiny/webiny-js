import type { Client } from "@webiny/api-elasticsearch";
import { esGetIndexName } from "~/utils/index.js";

export interface GetIndexExistParams {
    elasticsearchClient: Client;
    tenant: string;
    type: string;
    isHeadlessCmsModel?: boolean;
}

export const esGetIndexExist = async (params: GetIndexExistParams) => {
    const { elasticsearchClient, tenant, type, isHeadlessCmsModel } = params;

    try {
        const index = esGetIndexName({ tenant, type, isHeadlessCmsModel });

        const response = await elasticsearchClient.indices.exists({
            index
        });

        if (response.body) {
            return true;
        }

        return false;
    } catch (ex) {
        console.warn(`Could not find index:`, ex.message);
        return false;
    }
};
