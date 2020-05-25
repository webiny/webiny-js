import { createHandler } from "@webiny/handler";
import headlessCmsHandler from "@webiny/api-headless-cms/handler";
import neDb from "@webiny/api-plugin-commodo-nedb";
import { Database } from "@commodo/fields-storage-nedb";
import securityServicePlugins from "@webiny/api-security/plugins/service";
import i18n from "@webiny/api-i18n/plugins/i18n";
import i18nLocales from "../mocks/I18NLocales";
import { dataManagerPlugins } from "../mocks/dataManagerClient";
import {
    GET_CONTENT_MODEL_BY_MODEL_ID,
    createCreateMutation,
    createListQuery,
    createDeleteMutation,
    createUpdateMutation,
    createPublishMutation,
    createListRevisionsQuery,
    createReadQuery,
    createCreateFromMutation,
    createUnpublishMutation
} from "./useApiHandler/graphql";

const database = new Database();

const createApolloHandler = () =>
    createHandler(
        neDb({ database }),
        securityServicePlugins({
            token: {
                secret: "secret"
            }
        }),
        i18n,
        i18nLocales(),
        headlessCmsHandler(),
        dataManagerPlugins()
    );

export default () => {
    const apolloHandler = createApolloHandler();
    const self = {
        database,
        apolloHandler,
        invoke: async ({ httpMethod = "POST", body, headers = {}, ...rest }) => {
            const response = await apolloHandler({
                httpMethod,
                headers,
                body: JSON.stringify(body),
                ...rest
            });

            return [JSON.parse(response.body), response];
        },
        content: async ({ modelId, environmentId, environmentAlias }) => {
            const pathParameters = { key: `manage/${environmentId || environmentAlias}` };

            const [body] = await self.invoke({
                pathParameters,
                body: {
                    query: GET_CONTENT_MODEL_BY_MODEL_ID,
                    variables: { modelId }
                }
            });

            const { data: contentModel, contentModelError } = body.data.getContentModel;
            if (contentModelError) {
                throw contentModelError;
            }

            const method = queryFactory => async variables => {
                const [body] = await self.invoke({
                    pathParameters,
                    body: {
                        query: queryFactory(contentModel),
                        variables
                    }
                });

                const { data, error } = body.data.content;
                if (error) {
                    throw error;
                }

                return data;
            };

            return {
                create: method(createCreateMutation),
                list: method(createListQuery),
                delete: method(createDeleteMutation),
                update: method(createUpdateMutation),
                publish: method(createPublishMutation),
                listRevisions: method(createListRevisionsQuery),
                read: method(createReadQuery),
                createFrom: method(createCreateFromMutation),
                unpublish: method(createUnpublishMutation)
            };
        }
    };

    return self;
};
