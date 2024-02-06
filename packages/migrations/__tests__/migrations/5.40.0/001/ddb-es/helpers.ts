import { createGzipCompression } from "@webiny/api-elasticsearch";
import { esGetIndexName } from "~/utils";
import { CmsEntry } from "@webiny/api-headless-cms/types";

export const getRecordIndexName = (entry: Pick<CmsEntry, "tenant" | "locale" | "modelId">) => {
    return esGetIndexName({
        tenant: entry.tenant,
        locale: entry.locale,
        type: entry.modelId,
        isHeadlessCmsModel: true
    });
};

export const getDecompressedData = async <R = any>(data: any): Promise<R> => {
    const compression = createGzipCompression();

    return (await compression.decompress(data)) as unknown as R;
};
