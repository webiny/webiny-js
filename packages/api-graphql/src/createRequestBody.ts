import zod from "zod";
import { parseJson } from "@webiny/utils/parseJson.js";
import { WebinyError } from "@webiny/error";
import { createZodError } from "@webiny/utils/createZodError.js";
import type { GraphQLRequestBody } from "~/types.js";

const requestBodySchema = zod.looseObject({
    query: zod.string(),
    variables: zod.record(zod.string(), zod.any()).nullish().optional(),
    operationName: zod
        .string()
        .nullish()
        .optional()
        .transform(value => {
            return value || undefined;
        })
});

const schema = zod.union([requestBodySchema, zod.array(requestBodySchema)]);

const invalidRequestError = (data?: Record<string, unknown> | null) => {
    return new WebinyError({
        message: "Invalid GraphQL request! Check your query and variables.",
        code: "GRAPHQL_REQUEST_INVALID",
        data
    });
};

/**
 * String bodies (e.g. sent as `text/plain`) are parsed with `parseJson`,
 * which rejects `__proto__` and `constructor.prototype` keys.
 */
const parseBody = (input: unknown): unknown => {
    if (typeof input !== "string") {
        return input;
    }
    try {
        return parseJson(input);
    } catch (ex) {
        throw invalidRequestError({ reason: (ex as Error).message });
    }
};

export const createRequestBody = (input: unknown): GraphQLRequestBody | GraphQLRequestBody[] => {
    const body = parseBody(input);

    const result = schema.safeParse(body);
    if (!result.success) {
        const error = createZodError(result.error);
        throw invalidRequestError(error.data);
    }
    return result.data;
};
