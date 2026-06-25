import type { CmsContext } from "~/types/index.js";
import { createCmsGraphQLSchemaPlugin } from "~/plugins/index.js";
import type { ICmsGraphQLSchemaPlugin } from "~/plugins/index.js";
import type { IGraphQLSchemaPlugin } from "@webiny/handler-graphql";
import { GraphQLSchemaPlugin } from "@webiny/handler-graphql";
import { ContextPlugin } from "@webiny/api";
import camelCase from "lodash/camelCase.js";
import { CmsModelFieldValidatorRegistry } from "~/features/validation/index.js";
import type { Container } from "@webiny/di";

const createSkipValidatorEnum = (container: Container) => {
    const registry = container.resolve(CmsModelFieldValidatorRegistry);
    const names = registry.getAll().reduce<string[]>((collection, validator) => {
        const name = camelCase(validator.name);
        if (collection.includes(name)) {
            return collection;
        }
        collection.push(name);
        return collection;
    }, []);

    if (names.length === 0) {
        names.push("_empty");
    }
    return /* GraphQL */ `
        enum SkipValidatorEnum {
           ${names.join("\n")}
        }
    `;
};

const createSchema = (context: CmsContext): IGraphQLSchemaPlugin<CmsContext>[] => {
    const skipValidatorEnum = createSkipValidatorEnum(context.container);

    const cmsPlugin = createCmsGraphQLSchemaPlugin({
        typeDefs: /* GraphQL */ `
            type CmsIdentity {
                id: String
                displayName: String
                type: String
            }

            type CmsError {
                code: String
                message: String
                data: JSON
                stack: String
            }

            type CmsCursors {
                next: String
                previous: String
            }

            type CmsListMeta {
                cursor: String
                hasMoreItems: Boolean
                totalCount: Int
            }

            input CmsDeleteEntryOptions {
                # force delete an entry that might have some records left behind in the database
                # see CmsDeleteEntryOptions in types.ts
                force: Boolean
                # permanently delete an entry without moving it to the bin
                permanently: Boolean
            }

            type CmsDeleteResponse {
                data: Boolean
                error: CmsError
            }

            type CmsDeleteMultipleDataResponse {
                id: ID!
            }

            type CmsDeleteMultipleResponse {
                data: [CmsDeleteMultipleDataResponse!]
                error: CmsError
            }

            type CmsBooleanResponse {
                data: Boolean
                error: CmsError
            }

            # Advanced Content Organization
            type WbyAcoLocation {
                folderId: ID
            }

            input WbyAcoLocationInput {
                folderId: ID!
            }

            input WbyAcoLocationWhereInput {
                folderId: ID
                folderId_in: [ID!]
                folderId_not: ID
                folderId_not_in: [ID!]
            }

            ${skipValidatorEnum}

            input CreateCmsEntryOptionsInput {
                skipValidators: [SkipValidatorEnum!]
            }

            input CreateRevisionCmsEntryOptionsInput {
                skipValidators: [SkipValidatorEnum!]
            }

            input UpdateCmsEntryOptionsInput {
                skipValidators: [SkipValidatorEnum!]
            }

            input CmsIdentityInput {
                id: String!
                displayName: String!
                type: String!
            }

            type CmsEntryValidationResponseData {
                error: String!
                id: String!
                fieldId: String!
                parents: [String!]!
            }

            type CmsEntryValidationResponse {
                data: [CmsEntryValidationResponseData!]
                error: CmsError
            }

            type CmsEntrySystem {
                _empty: String
            }

            type CmsEntryLive {
                version: Int!
            }

            input CmsEntryLiveWhereInput {
                version: Int
                version_gt: Int
                version_gte: Int
                version_lt: Int
                version_lte: Int
                version_not: Int
                version_in: [Int!]
                version_not_in: [Int!]
            }

            input ListWhereInputCmsEntrySystem {
                _empty: String
            }
        `,
        resolvers: {}
    });
    cmsPlugin.name = "headless-cms.graphql.schema.base";
    const corePlugin = new GraphQLSchemaPlugin<CmsContext>({
        typeDefs: cmsPlugin.schema.typeDefs,
        resolvers: cmsPlugin.schema.resolvers
    });
    corePlugin.name = "headless-cms.graphql.core.schema.base";
    /**
     * Due to splitting of CMS and Core schema plugins, we must have both defined for CMS to work.
     */
    return [cmsPlugin, corePlugin];
};

export const createBaseSchema = () => {
    const plugin = new ContextPlugin<CmsContext>(async context => {
        context.plugins.register(...createSchema(context));
    });

    plugin.name = "headless-cms.graphql.createBaseSchema";

    return plugin;
};

export const createBaseSchemaPlugins = (context: CmsContext): ICmsGraphQLSchemaPlugin[] => {
    const [cmsPlugin] = createSchema(context);
    return [cmsPlugin as ICmsGraphQLSchemaPlugin];
};
