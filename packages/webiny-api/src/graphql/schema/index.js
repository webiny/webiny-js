// @flow
import { graphql } from "graphql";
import { makeExecutableSchema, mergeSchemas } from "graphql-tools";
import GraphQLJSON from "graphql-type-json";
import { GraphQLDateTime } from "graphql-iso-date";
import { genericTypes } from "./genericTypes";
import { getPlugins } from "webiny-plugins";

/**
 * Maps data sources and returns array of executable schema
 * @param  {Array}   sources     data sources to combine
 * @return {Array}               list of executable schemas
 */
const mapSourcesToExecutableSchemas = (sources: Array<Object>) => {
    const schemas = {};

    sources.forEach(({ typeDefs, resolvers, namespace, schemaDirectives }) => {
        // Prepare "typeDefs".
        if (typeof typeDefs === "function") {
            typeDefs = typeDefs();
        }

        if (!Array.isArray(typeDefs)) {
            typeDefs = [typeDefs];
        }

        // Prepare "resolvers".
        if (typeof resolvers === "function") {
            resolvers = resolvers();
        }

        if (!Array.isArray(resolvers)) {
            resolvers = [resolvers];
        }

        schemas[namespace] = makeExecutableSchema({
            typeDefs: [
                `scalar JSON
                 scalar DateTime`,
                genericTypes,
                ...typeDefs
            ],
            resolvers: [
                {
                    JSON: GraphQLJSON,
                    DateTime: GraphQLDateTime
                },
                ...resolvers
            ],
            schemaDirectives
        });
    });

    return schemas;
};

/**
 * @return {schema, context}
 */
export function prepareSchema() {
    const dataSources = getPlugins("graphql");
    const schemas = mapSourcesToExecutableSchemas(dataSources);

    const securityScopes = [
        ...new Set(dataSources.reduce((res, item) => res.concat(item.scopes || []), []))
    ];
    const sourcesWithStitching = dataSources.filter(source => source.stitching);
    const linkTypeDefs = sourcesWithStitching.map(source => source.stitching.linkTypeDefs);
    const resolvers = sourcesWithStitching.map(source => source.stitching.resolvers);

    const schema = mergeSchemas({
        schemas: [...Object.values(schemas), ...linkTypeDefs],
        resolvers: {
            ...resolvers,
            // Add all scopes to the schema
            SecurityQuery: {
                scopes: () => securityScopes
            }
        }
    });

    return {
        schema,
        context: (globalContext: Object) => {
            getPlugins("graphql-context").forEach(plugin => {
                plugin.apply(globalContext);
            });

            return globalContext;
        }
    };
}

export function createGraphqlRunner(schema: Object, ctx: Object) {
    return (opts: Object) => {
        return graphql(
            opts.schema || schema,
            opts.source,
            null,
            opts.context || ctx,
            opts.variables
        );
    };
}
