import zod from "zod";
import { WebinyError } from "@webiny/error";
import { createZodError } from "@webiny/utils/createZodError.js";
import type { GraphQLRequestBody } from "~/types.js";

const requestBodySchema = zod
    .object({
        query: zod.string(),
        variables: zod.record(zod.string(), zod.any()).nullish().optional(),
        operationName: zod
            .string()
            .nullish()
            .optional()
            .transform(value => {
                return value || undefined;
            })
    })
    .passthrough();

const schema = zod.union([requestBodySchema, zod.array(requestBodySchema)]);

export const createRequestBody = (input: unknown): GraphQLRequestBody | GraphQLRequestBody[] => {
    const body = typeof input === "string" ? JSON.parse(input) : input;

    const result = schema.safeParse(body);
    if (!result.success) {
        const error = createZodError(result.error);
        throw new WebinyError({
            message: "Invalid GraphQL request! Check your query and variables.",
            code: "GRAPHQL_REQUEST_INVALID",
            data: error.data
        });
    }
    return result.data;
};
