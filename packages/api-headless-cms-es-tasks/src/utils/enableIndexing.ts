import type { Client } from "@webiny/api-elasticsearch";
import type { CmsModel } from "@webiny/api-headless-cms/types/index.js";
import { configurations } from "@webiny/api-headless-cms-ddb-es/configurations.js";

interface IEnableIndexingParams {
    client: Client;
    model: Pick<CmsModel, "modelId" | "tenant">;
}

export const enableIndexing = async (params: IEnableIndexingParams) => {
    const { client, model } = params;
    const { index } = configurations.es({
        model
    });
    try {
        await client.indices.putSettings({
            index,
            body: {
                index: {
                    number_of_replicas: 1,
                    refresh_interval: "1s"
                }
            }
        });
    } catch (ex) {
        console.error(ex);
        throw ex;
    }
};
