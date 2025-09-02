import zod from "zod";
import type { CmsContext } from "@webiny/api-headless-cms/types";
import type { DataLoaderRequest, DataLoaderResult, IDataSource } from "~/dataSources";
import { ModelListQuery } from "~/dataSources/cmsDataSources/ModelListQuery";

export interface CmsEntriesDataSourceConfig {
    modelId: string;
    limit: number;
}

export class CmsEntriesDataSource implements IDataSource<CmsEntriesDataSourceConfig> {
    private cms: CmsContext["cms"];

    constructor(cms: CmsContext["cms"]) {
        this.cms = cms;
    }

    getType() {
        return "cms.entries";
    }

    getConfigSchema(): zod.Schema<CmsEntriesDataSourceConfig> {
        return zod.object({
            modelId: zod.string(),
            limit: zod.number()
        });
    }

    async load(request: DataLoaderRequest<CmsEntriesDataSourceConfig>): Promise<DataLoaderResult> {
        const requestedPaths = request.getPaths();
        const queryPaths = !requestedPaths || requestedPaths.length === 0 ? ["id"] : requestedPaths;

        const config = request.getConfig();
        const schemaClient = await this.cms.getExecutableSchema("preview");
        const model = await this.cms.getModel(config.modelId);

        const listQuery = new ModelListQuery();
        const query = listQuery.getQuery(model, queryPaths);

        const response = await schemaClient({
            query,
            operationName: "ListEntries",
            variables: {
                limit: config.limit || 10
            }
        });

        // @ts-expect-error Naive return for the time being.
        return response.data.entries.data;
    }
}
