import { graphql } from "graphql";
import { makeExecutableSchema, addMockFunctionsToSchema, mergeSchemas } from "graphql-tools";
import GraphQLJSON from "graphql-type-json";
import { GraphQLDateTime } from "graphql-iso-date";
import mapResolvers from "./mapResolvers";
import { genericTypes } from "./genericTypes";

/**
 * Adds supplied options to the Apollo options object.
 * @param  {Object} options  Apollo options for the methods used in GrAMPS
 * @return {Object}          Default options, extended with supplied options
 */
const getDefaultApolloOptions = options => ({
    makeExecutableSchema: {},
    addMockFunctionsToSchema: {},
    ...options
});

/**
 * Maps data sources and returns array of executable schema
 * @param  {Array}   sources     data sources to combine
 * @param  {Boolean} shouldMock  whether or not to mock resolvers
 * @param  {Object}  options     additional apollo options
 * @return {Array}               list of executable schemas
 */
const mapSourcesToExecutableSchemas = (sources, shouldMock, options) => {
    const schemas = {};

    sources.forEach(({ scopes, typeDefs, resolvers, mocks, namespace, schemaDirectives }) => {
        const executableSchema = makeExecutableSchema({
            typeDefs: `
                scalar JSON
                scalar DateTime
                type Error {
                    code: String
                    message: String
                    data: JSON
                }
                ${genericTypes()}
                ${typeDefs}
            `,
            resolvers: {
                JSON: GraphQLJSON,
                DateTime: GraphQLDateTime,
                Error: () => ({}),
                ...mapResolvers(namespace, resolvers)
            },
            schemaDirectives
        });

        if (shouldMock) {
            addMockFunctionsToSchema({
                ...options.addMockFunctionsToSchema,
                schema: executableSchema,
                mocks
            });
        }

        schemas[namespace] = executableSchema;
    });

    return schemas;
};

/**
 * Combine schemas, optionally add mocks, and configure `apollo-server-express`.
 *
 * This is the core of GrAMPS, and does a lot. It accepts an array of data
 * sources and combines them into a single schema, resolver set, and context
 * using `graphql-tools` `makeExecutableSchema`. If the `enableMockData` flag is
 * set, mock resolvers are added to the schema using `graphql-tools`
 * `addMockFunctionsToSchema()`.
 *
 * Additional options for any of the Apollo functions can be passed in the
 * `apollo` argument using the function’s name as the key:
 *
 *     {
 *       apollo: {
 *         addMockFunctionsToSchema: {
 *           preserveResolvers: true,
 *         },
 *       },
 *     }
 *
 * @see http://dev.apollodata.com/tools/graphql-tools/mocking.html#addMockFunctionsToSchema
 * @see http://dev.apollodata.com/tools/graphql-tools/generate-schema.html#makeExecutableSchema
 *
 * @param  {Array?}    config.dataSources     data sources to combine
 * @param  {boolean?}  config.enableMockData  whether to add mock resolvers
 * @param  {Function?} config.extraContext    function to add additional context
 * @param  {Object?}   config.logger          requires `info` & `error` methods
 * @param  {Object?}   config.apollo          options for Apollo functions
 * @return {Function}                         req => options for `graphqlExpress()`
 */
export function prepareSchema({
    dataSources = [],
    enableMockData = false,
    logger = console,
    apollo = {}
} = {}) {
    // Make sure all Apollo options are set properly to avoid undefined errors.
    const apolloOptions = getDefaultApolloOptions(apollo);

    const schemas = mapSourcesToExecutableSchemas(dataSources, enableMockData, apolloOptions);

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

    const getContext = globalContext => {
        return dataSources.reduce((allContext, source) => {
            const sourceContext =
                typeof source.context === "function"
                    ? source.context(globalContext)
                    : source.context;

            return {
                ...allContext,
                [source.namespace]: sourceContext
            };
        }, {});
    };

    return {
        schema,
        context: getContext
    };
}

export function createGraphqlRunner(schema, ctx) {
    return opts => {
        return graphql(
            opts.schema || schema,
            opts.source,
            null,
            opts.context || ctx,
            opts.variables
        );
    };
}
