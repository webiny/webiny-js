import WebinyError from "@webiny/error";
import {
    getBaseConfiguration,
    getOpenSearchIndexPrefix,
    isSharedOpenSearchIndex
} from "@webiny/api-opensearch";
import type { StorageCmsModel } from "@webiny/api-headless-cms/types/index.js";

export const configurations = {
    es(params: { model: Pick<StorageCmsModel, "tenant" | "modelId"> }) {
        const { model } = params;
        const { tenant } = model;

        if (!tenant) {
            throw new WebinyError(
                `Missing "tenant" parameter when trying to create Elasticsearch index name.`,
                "TENANT_ERROR"
            );
        }

        const shared = isSharedOpenSearchIndex();
        const index = [shared ? "root" : tenant, "headless-cms", model.modelId]
            .join("-")
            .toLowerCase();

        const prefix = getOpenSearchIndexPrefix();

        return {
            index: prefix ? prefix + index : index,
            settings: getBaseConfiguration(),
            shared
        };
    }
};
