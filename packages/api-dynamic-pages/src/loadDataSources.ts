import { PbContext } from "@webiny/api-page-builder/types";
import { DataSourceSettings } from "~/types";
import { DataSource, DataSourcePlugin } from "~/plugins/DataSourcePlugin";

export const loadDataSources = async (
    settings: DataSourceSettings[],
    variables: Record<string, any>,
    context: PbContext
) => {
    const dataSources = [];
    const dataSourcePlugins = context.plugins.byType<DataSourcePlugin>(DataSourcePlugin.type);

    const sourcesByType: Record<string, DataSource> = {};
    dataSourcePlugins.forEach(pl => {
        sourcesByType[pl.getType()] = pl.getDataSource();
    });

    for (const dsConfig of settings) {
        const { id, type, config } = dsConfig;
        const dataSource = sourcesByType[type];

        if (!dataSource) {
            continue;
        }

        const data = await dataSource.loadData(variables, config, context);

        dataSources.push({ id, type, data });
    }

    return dataSources;
};
