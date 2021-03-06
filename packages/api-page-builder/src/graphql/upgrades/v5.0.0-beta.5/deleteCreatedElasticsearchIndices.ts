import { CmsContext } from "@webiny/api-headless-cms/types";
import { ElasticsearchConfig } from "@webiny/api-headless-cms/utils";

export const deleteCreatedElasticsearchIndices = async (
    context: CmsContext,
    indexes: ElasticsearchConfig[]
): Promise<void> => {
    await Promise.all(
        indexes.map(index => {
            return context.elasticSearch.indices.delete(index);
        })
    );
};
