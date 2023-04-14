import { GraphQLRequestBody } from "@webiny/handler-graphql/types";

export const createRequestBody = (body: unknown): GraphQLRequestBody | GraphQLRequestBody[] => {
    /**
     * We are trusting that the body payload is correct.
     * The `processRequestBody` will fail if it is not.
     */
    return typeof body === "string" ? JSON.parse(body) : body;
};
