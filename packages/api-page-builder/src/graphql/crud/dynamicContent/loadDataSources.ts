import fetch from "node-fetch";
import { DataSourceSettings, PbContext } from "@webiny/api-page-builder/types";

export const loadDataSources = async (
    settings: DataSourceSettings[],
    variables: Record<string, any>,
    context: PbContext
) => {
    const dataSources = [];
    const apiKey = await context.cms.getReadAPIKey();

    for (let i = 0; i < settings.length; i++) {
        const { name, config } = settings[i];
        try {
            const withValues = JSON.parse(
                Object.keys(variables).reduce((string, key) => {
                    return string.replace(`{${key}}`, variables[key]);
                }, config.variables)
            );
            3;

            const { data } = await fetch(config.url, {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: apiKey },
                body: JSON.stringify({ query: config.query, variables: withValues })
            }).then(res => res.json());

            dataSources.push({ name, data });
        } catch (err) {
            console.log(`Error while loading "${name}" datasource`, err);
        }
    }

    return dataSources;
};
