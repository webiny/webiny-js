import fetch from "node-fetch";
import { DataSourceSettings, PbContext } from "@webiny/api-page-builder/types";
import { interpolateVariables } from "./interpolateVariables";

/**
 * NOTE: at this point, we're only loading `get-entry` data source!
 */
export const loadDataSources = async (
    settings: DataSourceSettings[],
    variables: Record<string, any>,
    context: PbContext
) => {
    const dataSources = [];
    const apiKey = await context.cms.system.getReadAPIKey();

    const dataSourceConfig = settings.find(ds => ds.id === "get-entry");

    if (dataSourceConfig) {
        const { id, config } = dataSourceConfig;

        try {
            const res = await fetch(config.url, {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: apiKey },
                body: JSON.stringify({
                    query: config.query,
                    variables: interpolateVariables(config.variables, variables)
                })
            }).then(res => res.json());
            
            dataSources.push({ id, data: res.data });
        } catch (err) {
            console.log(`Error while loading "${id}" datasource`, err.message);
        }
    }

    return dataSources;
};
