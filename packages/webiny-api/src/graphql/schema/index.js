// @flow
import { graphql } from "graphql";
import { makeExecutableSchema, mergeSchemas } from "graphql-tools";
import GraphQLJSON from "graphql-type-json";
import { GraphQLDateTime } from "graphql-iso-date";
import { genericTypes } from "./genericTypes";
import { getPlugins } from "webiny-plugins";
import GraphQLLong from "graphql-type-long";

/**
 * Maps data sources and returns array of executable schema
 * @param  {Array}   sources     data sources to combine
 * @return {Array}               list of executable schemas
 */
const mapSourcesToExecutableSchemas = (sources: Array<Object>) => {
    const schemas = {};

    sources.forEach(({ typeDefs, resolvers, namespace, schemaDirectives }) => {
        if (!typeDefs) {
            return;
        }

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
                `scalar Long
                 scalar JSON
                 scalar DateTime`,
                genericTypes,
                ...typeDefs
            ],
            resolvers: [
                {
                    Long: GraphQLLong,
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
export async function prepareSchema(config: Object) {
    // This allows developers to register more plugins dynamically, before the graphql schema is instantiated.
    const gqlPlugins = getPlugins("graphql-schema");
    for (let i = 0; i < gqlPlugins.length; i++) {
        if (typeof gqlPlugins[i].prepare === "function") {
            await gqlPlugins[i].prepare(config);
        }
    }

    const schemaDefs = [];
    const schemaPlugins = getPlugins("graphql-schema");
    for (let i = 0; i < schemaPlugins.length; i++) {
        const { schema } = schemaPlugins[i];
        if (!schema) {
            continue;
        }

        if (typeof schema === "function") {
            schemaDefs.push(await schema(config));
        } else {
            schemaDefs.push(schema);
        }
    }

    const schemas = mapSourcesToExecutableSchemas(schemaDefs);

    const defsWithStitching = schemaDefs.filter(source => source.stitching);
    const linkTypeDefs = defsWithStitching.map(source => source.stitching.linkTypeDefs);
    const resolvers = defsWithStitching.map(source => source.stitching.resolvers);

    return mergeSchemas({
        schemas: [...Object.values(schemas), ...linkTypeDefs],
        resolvers
    });
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
