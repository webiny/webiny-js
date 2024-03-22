import { CmsContext, CmsModelFieldValidatorPlugin } from "~/types";
import { createCmsGraphQLSchemaPlugin } from "~/plugins";
import { GraphQLSchemaPlugin, IGraphQLSchemaPlugin } from "@webiny/handler-graphql";
import { PluginsContainer } from "@webiny/plugins";
import { ContextPlugin } from "@webiny/api";
import camelCase from "lodash/camelCase";

const createSkipValidatorEnum = (plugins: PluginsContainer) => {
    const validators = plugins
        .byType<CmsModelFieldValidatorPlugin>("cms-model-field-validator")
        .reduce<string[]>((collection, validator) => {
            const name = camelCase(validator.validator.name);
            if (collection.includes(name)) {
                return collection;
            }
            collection.push(name);
            return collection;
        }, []);

    if (validators.length === 0) {
        validators.push("_empty");
    }
    return /* GraphQL */ `
        enum SkipValidatorEnum {
           ${validators.join("\n")}
        }
    `;
};

const createSchema = (plugins: PluginsContainer): IGraphQLSchemaPlugin<CmsContext>[] => {
    const skipValidatorEnum = createSkipValidatorEnum(plugins);

    const cmsPlugin = createCmsGraphQLSchemaPlugin({
        typeDefs: /* GraphQL */ `
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
    return new ContextPlugin(async context => {
        context.plugins.register(...createSchema(context.plugins));
    });
};
