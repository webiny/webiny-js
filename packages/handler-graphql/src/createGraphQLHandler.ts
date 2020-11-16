import { HandlerPlugin, Context } from "@webiny/handler/types";
import { HandlerGraphQLOptions } from "./types";
import { HttpContext } from "@webiny/handler-http/types";
import { makeExecutableSchema } from "@graphql-tools/schema";
import { GraphQLScalarPlugin } from "@webiny/graphql/types";
import gql from "graphql-tag";
import { graphql } from "graphql";
import GraphQLJSON from "graphql-type-json";
import { GraphQLDateTime } from "graphql-iso-date";
import GraphQLLong from "graphql-type-long";
import { RefInput } from "./builtInTypes/RefInputScalar";
import { Number } from "./builtInTypes/NumberScalar";
import { Any } from "./builtInTypes/AnyScalar";
import { boolean } from "boolean";

const DEFAULT_HEADERS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "*",
    "Access-Control-Allow-Methods": "OPTIONS,POST"
};

let schema;

export default (options: HandlerGraphQLOptions = {}): HandlerPlugin => ({
    type: "handler",
    name: "handler-graphql",
    async handle(context: Context & HttpContext, next) {
        const { http } = context;
        if (!http) {
            return next();
        }

        if (http.method === "OPTIONS") {
            return http.response({
                statusCode: 204,
                headers: DEFAULT_HEADERS
            });
        }

        if (http.method !== "POST") {
            return next();
        }

        if (!schema) {
            const scalars = context.plugins
                .byType<GraphQLScalarPlugin>("graphql-scalar")
                .map(item => item.scalar);

            const typeDefs = [
                gql`
                    type Query
                    type Mutation
                    ${scalars.map(scalar => `scalar ${scalar.name}`).join(" ")}
                    scalar JSON
                    scalar Long
                    scalar DateTime
                    scalar RefInput
                    scalar Number
                    scalar Any
                `
            ];

            const resolvers = [
                {
                    ...scalars.reduce((acc, s) => {
                        acc[s.name] = s;
                        return acc;
                    }, {}),
                    JSON: GraphQLJSON,
                    DateTime: GraphQLDateTime,
                    Long: GraphQLLong,
                    RefInput,
                    Number,
                    Any
                }
            ];

            const gqlPlugins = context.plugins.byType("graphql-schema");
            for (let i = 0; i < gqlPlugins.length; i++) {
                const plugin = gqlPlugins[i];
                typeDefs.push(plugin.schema.typeDefs);
                resolvers.push(plugin.schema.resolvers);
            }

            schema = makeExecutableSchema({
                typeDefs,
                resolvers
            });
        }

        try {
            const body = JSON.parse(http.body);
            let result;
            if (Array.isArray(body)) {
                const promises = [];
                for (let i = 0; i < body.length; i++) {
                    const { query, variables, operationName } = body[i];
                    promises.push(graphql(schema, query, {}, context, variables, operationName));
                }

                result = await Promise.all(promises);
            } else {
                const { query, variables, operationName } = body;
                result = await graphql(schema, query, {}, context, variables, operationName);
            }

            return http.response({
                body: JSON.stringify(result),
                statusCode: 200,
                headers: DEFAULT_HEADERS
            });
        } catch (e) {
            const report = {
                error: {
                    name: e.constructor.name,
                    message: e.message,
                    stack: e.stack
                }
            };

            console.log(
                "[@webiny/handler-graphql] An error occurred:",
                JSON.stringify(report, null, 2)
            );

            if (boolean(options.debug)) {
                return context.http.response({
                    statusCode: 500,
                    body: JSON.stringify(report, null, 2),
                    headers: {
                        ...DEFAULT_HEADERS,
                        "Cache-Control": "no-store",
                        "Content-Type": "text/json"
                    }
                });
            }

            throw e;
        }
    }
});
