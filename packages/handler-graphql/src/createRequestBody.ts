import type { GraphQLRequestBody } from "~/types.js";
import { createZodError } from "@webiny/utils/createZodError.js";
import zod from "zod";

const requestBodySchema = zod
    .object({
        query: zod.string(),
        variables: zod.record(zod.any()).nullish().optional(),
        operationName: zod.string().optional()
    })
    .passthrough();

const schema = zod.union([requestBodySchema, zod.array(requestBodySchema)]);

export const createRequestBody = (input: unknown): GraphQLRequestBody | GraphQLRequestBody[] => {
    const body = typeof input === "string" ? JSON.parse(input) : input;

    const result = schema.safeParse(body);
    if (!result.success) {
        throw createZodError(result.error);
    }
    return result.data;
};
