import dbPlugins from "@webiny/handler-db";
import { PluginsContainer } from "@webiny/plugins";
import { getDocumentClient } from "@webiny/project-utils/testing/dynamodb/index.js";
import { DynamoDbDriver } from "@webiny/db-dynamodb";
import type { CmsContext } from "~/types";
import { Context } from "@webiny/api";

export interface ICreateStorageOperationsContextParams {
    plugins?: PluginsContainer;
}

export const createStorageOperationsContext = async (
    params: ICreateStorageOperationsContextParams
): Promise<CmsContext> => {
    const dbPluginsInitialized = dbPlugins({
        table: process.env.DB_TABLE,
        driver: new DynamoDbDriver({
            documentClient: getDocumentClient()
        })
    });
    const plugins = params.plugins || new PluginsContainer([]);
    plugins.register(...dbPluginsInitialized);

    const context = new Context({
        plugins,
        WBY_VERSION: "0.0.0"
    }) as unknown as CmsContext;

    for (const db of dbPluginsInitialized) {
        await db.apply(context);
    }

    return context;
};
