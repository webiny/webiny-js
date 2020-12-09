import { HandlerPlugin } from "@webiny/handler/types";
import { boolean } from "boolean";
import { graphql, GraphQLSchema } from "graphql";
import { makeExecutableSchema } from "@graphql-tools/schema";
import {
    CmsEnvironmentAliasType,
    CmsEnvironmentType,
    HeadlessCmsContext
} from "@webiny/api-headless-cms/types";
import { I18NLocale } from "@webiny/api-i18n/types";

type CreateGraphQLHandlerOptionsType = {
    debug?: boolean;
};
type SchemaCacheType = {
    key: string;
    schema: GraphQLSchema;
};
type ArgsType = {
    context: HeadlessCmsContext;
    type: string;
    environment: CmsEnvironmentType;
    environmentAlias: CmsEnvironmentAliasType;
    locale: I18NLocale;
};
type ParsedBody = {
    query: string;
    variables: any;
    operationName: string;
};

type EnvironmentAndAliasResponseType = {
    environment: CmsEnvironmentType;
    environmentAlias?: CmsEnvironmentAliasType;
};

const DEFAULT_HEADERS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "*",
    "Access-Control-Allow-Methods": "OPTIONS,POST"
};
const respond = (http, result: any) => {
    return http.response({
        body: JSON.stringify(result),
        statusCode: 200,
        headers: DEFAULT_HEADERS
    });
};
const schemaList = new Map<string, SchemaCacheType>();
/**
 * generate cache key from last changed values on environment and its aliases, content model group (type)
 * and locale code
 * TODO check if it needs to be hashed with sha1 or some other fast hashing algorithm
 */
const generateCacheKey = (args: ArgsType): string => {
    const { environment, environmentAlias, locale, type } = args;
    return [
        String(environment.changedOn || environment.createdOn),
        environmentAlias ? String(environmentAlias.changedOn || environmentAlias.createdOn) : null,
        locale.code,
        String(type)
    ]
        .filter(value => !!value)
        .join("#");
};
// TODO need to generate schema for current model from the http parameters
// eslint-disable-next-line
const generateSchema = async (args: ArgsType): Promise<GraphQLSchema> => {
    const typeDefs = [];

    const resolvers = [];

    return makeExecutableSchema({
        typeDefs,
        resolvers
    });
};
// gets an existing schema or rewrites existing one or creates a completely new one
// depending on the schemaId created from type, environment and locale parameters
const getSchema = async (args: ArgsType): Promise<GraphQLSchema> => {
    const { type, environment, locale } = args;
    const id = `${type}#${environment.slug}#${locale.code}`;

    const cacheKey = await generateCacheKey(args);
    if (!schemaList.has(id)) {
        const schema = await generateSchema(args);
        schemaList.set(id, {
            key: cacheKey,
            schema
        });
        return schema;
    }
    const cache = schemaList.get(id);
    if (cache.key === cacheKey) {
        return cache.schema;
    }
    const schema = await generateSchema(args);
    schemaList.set(id, {
        key: cacheKey,
        schema
    });
    return schema;
};

const filterEnvironment = (list: CmsEnvironmentType[], id: string): CmsEnvironmentType => {
    const environment = list.find(env => env.id === id);
    if (!environment) {
        throw new Error(`There is no environment "${id}".`);
    }
    return environment;
};
const fetchEnvironmentAndItsAlias = async (
    context: HeadlessCmsContext
): Promise<EnvironmentAndAliasResponseType> => {
    const environmentList = await context.crud.environment.list();
    const environmentAliasList = await context.crud.environmentAlias.list();

    const value = context.cms.environment;
    // alias is always checked by slug
    const environmentAlias = environmentAliasList.find(model => {
        return model.slug === value;
    });
    if (environmentAlias) {
        const environment = filterEnvironment(environmentList, environmentAlias.environment.id);
        return {
            environmentAlias,
            environment
        };
    }
    // environment is always checked by id
    const environment = environmentList.find(model => {
        return model.id === value;
    });
    if (!environment) {
        throw new Error(`There is no environment or environment alias "${value}".`);
    }
    return {
        environment,
        environmentAlias: environmentAliasList.find(
            alias => alias.environment.id === environment.id
        )
    };
};

export const createGraphQLHandler = (
    options: CreateGraphQLHandlerOptionsType = {}
): HandlerPlugin => ({
    type: "handler",
    name: "handler-graphql-content-model",
    async handle(context: HeadlessCmsContext, next) {
        const { http } = context;

        if (!http || !http.path || !http.path.parameters) {
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

        try {
            const { environment, environmentAlias } = await fetchEnvironmentAndItsAlias(context);
            // need to attach environment and environment alias getters to the context for later use
            // and attach real environment slug to the context
            context.cms.environment = environment.slug;
            context.cms.getEnvironment = () => environment;
            context.cms.getEnvironmentAlias = () => environmentAlias;

            const schema = await getSchema({
                context,
                locale: context.i18n.getCurrentLocale(),
                environment,
                environmentAlias,
                type: context.cms.type
            });
            const body: ParsedBody | ParsedBody[] = JSON.parse(http.body);

            if (Array.isArray(body)) {
                const promises = [];
                for (const { query, variables, operationName } of body) {
                    promises.push(graphql(schema, query, {}, context, variables, operationName));
                }

                const result = await Promise.all(promises);
                return respond(http, result);
            }

            const { query, variables, operationName } = body;
            const result = await graphql(schema, query, {}, context, variables, operationName);
            return respond(http, result);
        } catch (ex) {
            const report = {
                error: {
                    name: ex.constructor.name,
                    message: ex.message,
                    stack: ex.stack
                }
            };
            const body = JSON.stringify(report);
            console.log("[@webiny/api-headless-cms] An error occurred: ", body);

            if (boolean(options.debug)) {
                return context.http.response({
                    statusCode: 500,
                    body,
                    headers: {
                        ...DEFAULT_HEADERS,
                        "Cache-Control": "no-store",
                        "Content-Type": "text/json"
                    }
                });
            }

            throw ex;
        }
    }
});
