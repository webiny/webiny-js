import { Client } from "@webiny/api-elasticsearch";
import { CmsModel } from "@webiny/api-headless-cms/types";
import { configurations } from "@webiny/api-headless-cms-ddb-es/configurations";

interface IEnableIndexingParams {
    client: Client;
    model: Pick<CmsModel, "modelId" | "tenant" | "locale">;
}

export const enableIndexing = async (params: IEnableIndexingParams) => {
    const { client, model } = params;
    const { index } = configurations.es({
        model
    });
    try {
        const response = await client.indices.getSettings({
            index
        });

        const setting = response.body[index].settings.index;

        if (setting.number_of_replicas !== "0" && setting.refresh_interval !== "-1") {
            return;
        }
    } catch (ex) {
        console.error(ex);
        throw ex;
    }
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
