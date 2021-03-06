import { CmsContext } from "../../../types";
import { ElasticsearchConfig } from "../../../utils";

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
