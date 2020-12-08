import { HandlerPlugin } from "@webiny/handler/types";
import { boolean } from "boolean";
import { graphql, GraphQLSchema } from "graphql";
import { makeExecutableSchema } from "@graphql-tools/schema";
import {
    CmsContentModelGroupType,
    CmsEnvironmentAliasType,
    CmsEnvironmentType,
    HeadlessCmsContext
} from "@webiny/api-headless-cms/types";
import { I18NLocale } from "@webiny/api-i18n/types";
import { extractHandlerHttpParameters } from "@webiny/api-headless-cms/content/helpers";

type CreateGraphQLHandlerOptionsType = {
    debug?: boolean;
};
type SchemaCacheType = {
    key: string;
    schema: GraphQLSchema;
};
type ArgsType = {
    context: HeadlessCmsContext;
    type: CmsContentModelGroupType;
    environment: CmsEnvironmentType;
    environmentAliases: CmsEnvironmentAliasType[];
    locale: I18NLocale;
};
type ParsedBody = {
    query: string;
    variables: any;
    operationName: string;
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
    const { environment, environmentAliases, locale, type } = args;
    return [String(environment.changedOn), locale.code, String(type.changedOn)]
        .concat(environmentAliases.map(alias => String(alias.changedOn)))
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
    const id = `${type.slug}#${environment.slug}#${locale.code}`;

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

const getEnvironment = async (
    context: HeadlessCmsContext,
    id: string
): Promise<CmsEnvironmentType> => {
    const environment = (await context.crud.environment.list()).find(model => model.slug === id);
    if (!environment) {
        throw new Error(`There is no environment "${id}".`);
    }
    return environment;
};
const getEnvironmentAliases = async (
    context: HeadlessCmsContext,
    environment: CmsEnvironmentType
): Promise<CmsEnvironmentAliasType[]> => {
    return (await context.crud.environmentAlias.list()).filter(
        alias => alias.environment.id === environment.id
    );
};
const getContentModelGroup = async (
    context: HeadlessCmsContext,
    id: string
): Promise<CmsContentModelGroupType> => {
    const group = (await context.crud.groups.list()).find(model => model.id === id);
    if (!group) {
        throw new Error(`There is no content model group "${id}".`);
    }
    return group;
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

        const {
            environment: currentEnvironment,
            locale,
            type: currentType
        } = extractHandlerHttpParameters(context);
        // TODO possibly extract getters outside of this plugin scope
        // possibly a plugin that will set up these variables onto the context?
        const environment = await getEnvironment(context, currentEnvironment);
        const environmentAliases = await getEnvironmentAliases(context, environment);
        const type = await getContentModelGroup(context, currentType);
        // TODO we should get environment and its aliases, content model group (type) and locale here
        const schema = await getSchema({
            context,
            locale: context.i18n.getCurrentLocale(locale),
            environment,
            environmentAliases,
            type
        });
        try {
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
