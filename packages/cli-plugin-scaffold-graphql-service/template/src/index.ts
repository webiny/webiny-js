import mdbid from "mdbid";
import { GraphQLSchemaPlugin } from "@webiny/handler-graphql/types";
import { ListResponse, Response, ErrorResponse } from "@webiny/handler-graphql";
import {
    ApplicationContext,
    CreateTargetArgs,
    DeleteTargetArgs,
    Target,
    GetTargetArgs,
    ListTargetsArgs,
    ListResolverResponse,
    ResolverResponse,
    UpdateTargetArgs
} from "./types";
import { configuration } from "./configuration";
import {
    createElasticsearchQuery,
    encodeElasticsearchCursor,
    decodeElasticsearchCursor,
    createElasticsearchSort
} from "./es";

const emptyResolver = () => ({});

export default (): GraphQLSchemaPlugin<ApplicationContext> => ({
    type: "graphql-schema",
    name: "graphql-schema-target",
    schema: {
        typeDefs: /* GraphQL */ `
            type TargetDeleteResponse {
                data: Boolean
                error: TargetError
            }

            type TargetListMeta {
                cursor: String
                hasMoreItems: Boolean!
                totalCount: Int!
            }

            type TargetError {
                code: String!
                message: String!
                data: JSON
            }

            type CreatedByResponse {
                id: String!
                displayName: String!
                type: String!
            }

            type Target {
                id: ID!
                createdOn: DateTime!
                savedOn: DateTime!
                createdBy: CreatedByResponse!
                title: String!
                description: String
                isNice: Boolean!
            }

            input TargetCreateInput {
                title: String!
                description: String
                isNice: Boolean
            }

            input TargetUpdateInput {
                title: String
                description: String
                isNice: Boolean
            }

            input TargetListWhereInput {
                # system fields
                id: String
                id_in: [String!]
                id_not: String
                id_not_in: [String!]
                savedOn_gt: DateTime
                savedOn_lt: DateTime
                createdOn_gt: DateTime
                createdOn_lt: DateTime

                # custom fields
                title_contains: String
                title_not_contains: String
                isNice: Boolean
            }

            enum TargetListSort {
                title_ASC
                title_DESC
                createdOn_ASC
                createdOn_DESC
                savedOn_ASC
                savedOn_DESC
            }

            type TargetResponse {
                data: Target
                error: TargetError
            }

            type TargetListResponse {
                data: [Target]
                meta: TargetListMeta
                error: TargetError
            }

            type InstallResponse {
                data: Boolean
                error: TargetError
            }

            type UninstallResponse {
                data: Boolean
                error: TargetError
            }

            type TargetQuery {
                getTarget(id: ID!): TargetResponse!

                listTargets(
                    where: TargetListWhereInput
                    sort: [TargetListSort!]
                    limit: Int
                    after: String
                ): TargetListResponse!
                isInstalled: InstallResponse!
            }

            type TargetMutation {
                createTarget(data: TargetCreateInput!): TargetResponse!

                updateTarget(id: ID!, data: TargetUpdateInput!): TargetResponse!

                deleteTarget(id: ID!): TargetDeleteResponse!

                install: InstallResponse!

                uninstall: UninstallResponse!
            }

            extend type Query {
                targets: TargetQuery
            }

            extend type Mutation {
                targets: TargetMutation
            }
        `,
        resolvers: {
            Query: {
                targets: emptyResolver
            },
            Mutation: {
                targets: emptyResolver
            },
            TargetQuery: {
                getTarget: async (
                    parent,
                    args: GetTargetArgs,
                    context
                ): Promise<ResolverResponse<Target>> => {
                    const { db } = context;
                    const { id } = args;

                    // retrieve from the database
                    const response = await db.read<Target>({
                        ...configuration.db(context),
                        query: {
                            PK: id,
                            SK: "A"
                        },
                        limit: 1
                    });
                    const [items] = response;
                    const [item] = items;
                    if (!item) {
                        return new ErrorResponse({
                            message: `Target with id "${id}" not found.`,
                            code: "NOT_FOUND",
                            data: {
                                id
                            }
                        });
                    }

                    return new Response(item);
                },
                listTargets: async (
                    parent,
                    args: ListTargetsArgs,
                    context
                ): Promise<ListResolverResponse<Target>> => {
                    const { elasticSearch } = context;
                    const { where, sort, limit, after } = args;

                    const size = !limit || limit <= 0 || limit >= 1000 ? 50 : limit;

                    const body = {
                        query: createElasticsearchQuery(where),
                        sort: createElasticsearchSort(sort),
                        // we always take one extra to see if there are more items to be fetched
                        size: size + 1,
                        // eslint-disable-next-line
                        search_after: decodeElasticsearchCursor(after) || undefined
                    };

                    let response;
                    try {
                        response = await elasticSearch.search({
                            ...configuration.es(context),
                            body
                        });
                    } catch (ex) {
                        return new ErrorResponse({
                            code: ex.code || "ELASTICSEARCH_ERROR",
                            message: ex.message,
                            data: ex
                        });
                    }
                    const { hits, total } = response.body.hits;

                    const items = hits.map((item: any) => item._source);

                    const hasMoreItems = items.length > size;
                    if (hasMoreItems) {
                        // Remove the last item from results, we don't want to include it.
                        items.pop();
                    }

                    const meta = {
                        hasMoreItems,
                        totalCount: total.value,
                        cursor:
                            items.length > 0
                                ? encodeElasticsearchCursor(hits[items.length - 1].sort)
                                : null
                    };

                    return new ListResponse(items, meta);
                },
                isInstalled: async (_, __, context) => {
                    const { security, elasticSearch } = context;
                    const hasFullAccess = await security.hasFullAccess();
                    if (!hasFullAccess) {
                        return new ErrorResponse({
                            message: "Not authorized.",
                            code: "NOT_AUTHORIZED"
                        });
                    }
                    try {
                        const esConfig = configuration.es(context);
                        const { body: hasIndice } = await elasticSearch.indices.exists(esConfig);
                        return new Response(hasIndice);
                    } catch (ex) {
                        return new ErrorResponse({
                            message: "Could not check for Elasticsearch index.",
                            code: "ELASTICSEARCH_ERROR",
                            data: ex
                        });
                    }
                }
            },
            TargetMutation: {
                install: async (_, __, context) => {
                    const { security, elasticSearch } = context;
                    const hasFullAccess = await security.hasFullAccess();
                    if (!hasFullAccess) {
                        return new ErrorResponse({
                            message: "Not authorized.",
                            code: "NOT_AUTHORIZED"
                        });
                    }
                    const esConfig = configuration.es(context);
                    const { body: hasIndice } = await elasticSearch.indices.exists(esConfig);
                    if (hasIndice) {
                        return new ErrorResponse({
                            message: "Already installed.",
                            code: "IS_INSTALLED"
                        });
                    }
                    try {
                        await elasticSearch.indices.create({
                            ...esConfig,
                            body: {
                                // need this part for sorting to work on text fields
                                settings: {
                                    analysis: {
                                        analyzer: {
                                            lowercase_analyzer: {
                                                type: "custom",
                                                filter: ["standard", "lowercase", "trim"],
                                                tokenizer: "keyword"
                                            }
                                        }
                                    }
                                },
                                mappings: {
                                    properties: {
                                        property: {
                                            type: "text",
                                            fields: {
                                                keyword: {
                                                    type: "keyword",
                                                    ignore_above: 256
                                                }
                                            },
                                            analyzer: "lowercase_analyzer"
                                        }
                                    }
                                }
                            }
                        });
                    } catch (ex) {
                        return new ErrorResponse({
                            message: "Could not create Elasticsearch index.",
                            code: "ELASTICSEARCH_ERROR",
                            data: ex
                        });
                    }
                    return new Response(true);
                },
                uninstall: async (_, __, context) => {
                    const { security, elasticSearch } = context;
                    const hasFullAccess = await security.hasFullAccess();
                    if (!hasFullAccess) {
                        return new ErrorResponse({
                            message: "Not authorized.",
                            code: "NOT_AUTHORIZED"
                        });
                    }
                    const esConfig = configuration.es(context);
                    const { body: hasIndice } = await elasticSearch.indices.exists(esConfig);
                    if (!hasIndice) {
                        return new ErrorResponse({
                            message: "Not installed.",
                            code: "NOT_INSTALLED"
                        });
                    }
                    try {
                        await elasticSearch.indices.delete(esConfig);
                    } catch (ex) {
                        return new ErrorResponse({
                            message: "Could not delete Elasticsearch index.",
                            code: "ELASTICSEARCH_ERROR",
                            data: ex
                        });
                    }
                    return new Response(true);
                },
                createTarget: async (
                    parent,
                    args: CreateTargetArgs,
                    context
                ): Promise<ResolverResponse<Target>> => {
                    const { db, security } = context;
                    const { data } = args;

                    const date = new Date().toISOString();

                    const model: Target = {
                        id: mdbid(),
                        createdBy: security.getIdentity(),
                        savedBy: security.getIdentity(),
                        createdOn: date,
                        savedOn: date,
                        // custom user defined fields
                        title: data.title,
                        description: data.description,
                        isNice: data.isNice === undefined ? false : data.isNice
                    };

                    const { index: esIndex } = configuration.es(context);

                    const batch = db.batch();
                    batch
                        // create the dynamodb target item
                        .create({
                            ...configuration.db(context),
                            data: {
                                PK: model.id,
                                SK: "A",
                                ...model,
                                webinyVersion: context.WEBINY_VERSION
                            }
                        })
                        // create the dynamodb target item in stream table
                        .create({
                            ...configuration.esDb(context),
                            data: {
                                PK: model.id,
                                SK: "A",
                                index: esIndex,
                                data: {
                                    ...model,
                                    webinyVersion: context.WEBINY_VERSION
                                }
                            }
                        });

                    try {
                        await batch.execute();
                    } catch (ex) {
                        return new ErrorResponse({
                            message: ex.message,
                            code: ex.code || "COULD_NOT_INSERT_DATA_INTO_DYNAMODB",
                            data: ex
                        });
                    }

                    return new Response(model);
                },
                updateTarget: async (
                    parent,
                    args: UpdateTargetArgs,
                    context
                ): Promise<ResolverResponse<Target>> => {
                    const { db } = context;
                    const { id, data } = args;

                    const [[item]] = await db.read<Target>({
                        ...configuration.db(context),
                        query: {
                            PK: id,
                            SK: "A"
                        },
                        limit: 1
                    });
                    if (!item) {
                        return new ErrorResponse({
                            message: `Target with id "${id}" not found.`,
                            code: "NOT_FOUND",
                            data: {
                                id
                            }
                        });
                    }
                    if (Object.keys(data).length === 0) {
                        return new Response(item);
                    }

                    const modelData: Target = {
                        ...item,
                        ...data,
                        savedOn: new Date().toISOString()
                    };
                    const excludeKeys = ["PK", "SK"];
                    const model: Target = Object.keys(modelData).reduce((acc, key) => {
                        if (excludeKeys.includes(key)) {
                            return acc;
                        }
                        acc[key] = modelData[key];
                        return acc;
                    }, ({} as unknown) as Target);

                    const { index: esIndex } = configuration.es(context);

                    const batch = db.batch();
                    batch
                        // dynamodb target update
                        .update({
                            ...configuration.db(context),
                            query: {
                                PK: id,
                                SK: "A"
                            },
                            data: {
                                PK: id,
                                SK: "A",
                                ...model,
                                webinyVersion: context.WEBINY_VERSION
                            }
                        })
                        .update({
                            ...configuration.esDb(context),
                            query: {
                                PK: id,
                                SK: "A"
                            },
                            data: {
                                PK: id,
                                SK: "A",
                                index: esIndex,
                                data: {
                                    ...model,
                                    webinyVersion: context.WEBINY_VERSION
                                }
                            }
                        });

                    try {
                        await batch.execute();
                    } catch (ex) {
                        return new ErrorResponse({
                            message: ex.message,
                            code: ex.code || "COULD_NOT_UPDATE_DATA_IN_DYNAMODB",
                            data: ex
                        });
                    }

                    return new Response(model);
                },
                deleteTarget: async (
                    parent,
                    args: DeleteTargetArgs,
                    context
                ): Promise<ResolverResponse<boolean>> => {
                    const { db } = context;
                    const { id } = args;

                    const [[item]] = await db.read<Target>({
                        ...configuration.db(context),
                        query: {
                            PK: id,
                            SK: "A"
                        },
                        limit: 1
                    });
                    if (!item) {
                        return new ErrorResponse({
                            message: `Target with id "${id}" not found.`,
                            code: "NOT_FOUND",
                            data: {
                                id
                            }
                        });
                    }
                    const batch = db.batch();
                    batch.delete(
                        {
                            ...configuration.db(context),
                            query: {
                                PK: id,
                                SK: "A"
                            }
                        },
                        {
                            ...configuration.esDb(context),
                            query: {
                                PK: id,
                                SK: "A"
                            }
                        }
                    );

                    try {
                        await batch.execute();
                    } catch (ex) {
                        return new ErrorResponse({
                            message: ex.message,
                            code: ex.code || "COULD_NOT_DELETE_DATA_FROM_DYNAMODB",
                            data: ex
                        });
                    }

                    return new Response(true);
                }
            }
        }
    }
});
