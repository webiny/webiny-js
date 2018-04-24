import { parseBody } from "express-graphql/dist/parseBody";
import type { GraphQLParams } from "express-graphql";
import httpError from "http-errors";
import url from "url";

import type { $Request } from "express";
import { parse } from "graphql";

/**
 * Helper function to get the GraphQL params from the request.
 */
function parseGraphQLParams(
    urlData: { [param: string]: mixed },
    bodyData: { [param: string]: mixed }
): GraphQLParams {
    // GraphQL Query string.
    let query = urlData.query || bodyData.query;
    if (typeof query !== "string") {
        query = null;
    }

    // Parse the variables if needed.
    let variables = urlData.variables || bodyData.variables;
    if (variables && typeof variables === "string") {
        try {
            variables = JSON.parse(variables);
        } catch (error) {
            throw httpError(400, "Variables are invalid JSON.");
        }
    } else if (typeof variables !== "object") {
        variables = null;
    }

    // Name of GraphQL operation to execute.
    let operationName = urlData.operationName || bodyData.operationName;
    if (typeof operationName !== "string") {
        operationName = null;
    }

    const raw = urlData.raw !== undefined || bodyData.raw !== undefined;

    // Parse source to AST, reporting any syntax error.
    query = parse(query);

    return { query, variables, operationName, raw };
}

export default function getGraphQLParams(request: $Request): Promise<GraphQLParams> {
    return parseBody(request).then(bodyData => {
        const urlData = (request.url && url.parse(request.url, true).query) || {};
        return parseGraphQLParams(urlData, bodyData);
    });
}
