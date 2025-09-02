import zod from "zod";
import type { CmsContext } from "@webiny/api-headless-cms/types";
import type { DataLoaderRequest, DataLoaderResult, IDataSource } from "~/dataSources";
import { ModelGetQuery } from "~/dataSources/cmsDataSources/ModelGetQuery";

export interface CmsEntryDataSourceConfig {
    modelId: string;
    entryId: string;
}

export class CmsEntryDataSource implements IDataSource<CmsEntryDataSourceConfig> {
    private cms: CmsContext["cms"];

    constructor(cms: CmsContext["cms"]) {
        this.cms = cms;
    }

    getType() {
        return "cms.entry";
    }

    getConfigSchema(): zod.Schema<CmsEntryDataSourceConfig> {
        return zod.object({
            modelId: zod.string(),
            entryId: zod.string()
        });
    }

    async load(request: DataLoaderRequest<CmsEntryDataSourceConfig>): Promise<DataLoaderResult> {
        const requestedPaths = request.getPaths();
        const queryPaths = !requestedPaths || requestedPaths.length === 0 ? ["id"] : requestedPaths;

        const config = request.getConfig();
        const schemaClient = await this.cms.getExecutableSchema("preview");
        const model = await this.cms.getModel(config.modelId);

        const listQuery = new ModelGetQuery();
        const query = listQuery.getQuery(model, queryPaths);

        const response = await schemaClient({
            query,
            operationName: "GetEntry",
            variables: {
                entryId: config.entryId
            }
        });

        // @ts-expect-error Naive return for the time being.
        return response.data.entry.data;
    }
}
