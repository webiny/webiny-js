import type { Client } from "@webiny/api-opensearch";
import { configurations } from "@webiny/api-headless-cms-ddb-es/configurations.js";
import type { CmsModel } from "@webiny/api-headless-cms/types/index.js";

export interface IDisableIndexingParams {
    client: Client;
    model: Pick<CmsModel, "modelId" | "tenant">;
}

export const disableIndexing = async (params: IDisableIndexingParams) => {
    const { client, model } = params;

    const { index } = configurations.es({
        model
    });

    try {
        await client.indices.putSettings({
            index,
            body: {
                index: {
                    number_of_replicas: 0,
                    refresh_interval: "-1"
                }
            }
        });
    } catch (ex) {
        console.error(ex);
        throw ex;
    }
};
