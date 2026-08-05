import { getOpenSearchIndexPrefix } from "@webiny/api-opensearch";
import type { Container } from "@webiny/feature/api/index.js";
import type { CmsModelOpenSearchIndex } from "../features/CmsModelOpenSearchIndex/abstractions.js";
import { CmsModelOpenSearchIndexProvider } from "../features/CmsModelOpenSearchIndex/index.js";

export const createTestModelIndexName = async (
    container: Container,
    params: CmsModelOpenSearchIndex.Params
): Promise<string> => {
    const provider = container.resolve(CmsModelOpenSearchIndexProvider);
    const result = await provider.execute(params);
    const prefix = getOpenSearchIndexPrefix();
    return prefix ? prefix + result.index : result.index;
};
