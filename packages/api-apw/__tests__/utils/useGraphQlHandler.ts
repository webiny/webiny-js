import { createGraphQlHandler, GQLHandlerCallableParams } from "~tests/utils/createGraphQlHandler";

export const useGraphQlHandler = (params: GQLHandlerCallableParams) => {
    return createGraphQlHandler(params);
};
