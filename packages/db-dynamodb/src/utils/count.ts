import { QueryAllParams } from "~/utils/query";

export const count = async (params: QueryAllParams): Promise<number> => {
    const { entity, partitionKey, options = {} } = params;
    const { Count } = await entity.query(partitionKey, { ...options, select: "count" });
    return Count || 0;
};
