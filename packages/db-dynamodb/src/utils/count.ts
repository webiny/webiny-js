import type { QueryAllParams } from "~/utils/query.js";

export const count = async (params: QueryAllParams): Promise<number> => {
    const { entity, partitionKey, options = {} } = params;
    // @ts-expect-error
    const { Count } = await entity.query(partitionKey, { ...options, select: "count" });
    return Count || 0;
};
