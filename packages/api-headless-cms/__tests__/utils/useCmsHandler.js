import { createHandler } from "@webiny/handler";
import headlessCmsHandler from "@webiny/api-headless-cms/content";
import neDb from "@webiny/api-plugin-commodo-nedb";
import { Database } from "@commodo/fields-storage-nedb";
import securityServicePlugins from "@webiny/api-security/plugins/service";
import i18n from "@webiny/api-i18n/plugins/i18n";
import i18nLocales from "../mocks/I18NLocales";
import { dataManagerPlugins } from "../mocks/dataManagerClient";
import {
    GET_CONTENT_MODEL_BY_MODEL_ID,
    CREATE_CONTENT_MODEL,
    createCreateMutation,
    createListQuery,
    createDeleteMutation,
    createUpdateMutation,
    createPublishMutation,
    createListRevisionsQuery,
    createReadQuery,
    createCreateFromMutation,
    createUnpublishMutation
} from "./useCmsHandler/graphql";

const database = new Database();

const createCmsHandler = () =>
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
    const cmsHandler = createCmsHandler();

    const invoke = async ({ httpMethod = "POST", body, headers = {}, ...rest }) => {
        const response = await cmsHandler({
            httpMethod,
            headers,
            body: JSON.stringify(body),
            ...rest
        });

        return [JSON.parse(response.body), response];
    };

    return {
        database,
        cmsHandler,
        invoke,
        environment: environmentId => {
            const environmentApi = {
                async invoke(args) {
                    if (!args.pathParameters) {
                        args.pathParameters = {};
                    }

                    args.pathParameters.key = `manage/${environmentId}`;

                    return invoke(args);
                },
                async createContentModel(variables) {
                    const [body] = await environmentApi.invoke({
                        body: {
                            query: CREATE_CONTENT_MODEL,
                            variables
                        }
                    });

                    const { data, error } = body.data.createContentModel;
                    if (error) {
                        throw error;
                    }

                    return data;
                },
                async content(modelId) {
                    const [body] = await environmentApi.invoke({
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
                        const [body] = await environmentApi.invoke({
                            body: {
                                query: queryFactory(contentModel),
                                variables
                            }
                        });

                        if (body.errors) {
                            throw body.errors;
                        }

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

            return environmentApi;
        }
    };
};
