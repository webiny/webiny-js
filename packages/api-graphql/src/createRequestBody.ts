import zod from "zod";
import { HttpClientError } from "@webiny/event-handler-core";
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

export const GRAPHQL_REQUEST_INVALID = "GRAPHQL_REQUEST_INVALID";

const INVALID_REQUEST_MESSAGE = "Invalid GraphQL request! Check your query and variables.";

/**
 * Validates an already-parsed GraphQL request body. The transport parses JSON bodies, so a string
 * here was either sent with another content type or is malformed JSON; both are refused rather
 * than parsed. Throws an `HttpClientError`, which the transports answer with a 400.
 */
export const createRequestBody = (input: unknown): GraphQLRequestBody | GraphQLRequestBody[] => {
    if (typeof input === "string") {
        throw new HttpClientError(400, GRAPHQL_REQUEST_INVALID, INVALID_REQUEST_MESSAGE, {
            reason: "The request body is not a JSON object."
        });
    }

    const result = schema.safeParse(input);
    if (!result.success) {
        const error = createZodError(result.error);
        throw new HttpClientError(
            400,
            GRAPHQL_REQUEST_INVALID,
            INVALID_REQUEST_MESSAGE,
            error.data ?? null
        );
    }
    return result.data;
};
