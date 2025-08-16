import type { GraphQLRequestBody } from "~/types.js";
import { createZodError } from "@webiny/utils/createZodError.js";
import zod from "zod";

const requestBodySchema = zod.object({
    query: zod.string(),
    variables: zod.record(zod.any()),
    operationName: zod.string()
});

const schema = requestBodySchema.or(zod.array(requestBodySchema));

export const createRequestBody = (input: unknown): GraphQLRequestBody | GraphQLRequestBody[] => {
    const body = typeof input === "string" ? JSON.parse(input) : input;

    const result = schema.safeParse(body);
    if (!result.success) {
        throw createZodError(result.error);
    }
    return result.data;
};
