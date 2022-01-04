import { introspectionQuery } from "graphql";
import { DocumentClient } from "aws-sdk/clients/dynamodb";
import i18nContext from "@webiny/api-i18n/graphql/context";
import i18nContentPlugins from "@webiny/api-i18n-content/plugins";
import { createHandler } from "@webiny/handler-aws";
import { mockLocalesPlugins } from "@webiny/api-i18n/graphql/testing";
import { ApiKey, SecurityIdentity } from "@webiny/api-security/types";
import apiKeyAuthentication from "@webiny/api-security/plugins/apiKeyAuthentication";
import apiKeyAuthorization from "@webiny/api-security/plugins/apiKeyAuthorization";
import { createPermissions, until, sleep, PermissionsArg } from "./helpers";
import {
    CREATE_WORKFLOW_MUTATION,
    DELETE_WORKFLOW_MUTATION,
    GET_WORKFLOW_QUERY,
    LIST_WORKFLOWS_QUERY,
    UPDATE_WORKFLOW_MUTATION
} from "./graphql/workflow";
import { Plugin, PluginCollection } from "@webiny/plugins/types";
import { createApwContext, createApwGraphQL } from "~/index";
/**
 * Unfortunately at we need to import the api-i18n-ddb package manually
 */
import i18nDynamoDbStorageOperations from "@webiny/api-i18n-ddb";
import { createTenancyAndSecurity } from "./tenancySecurity";
import { getStorageOperations } from "./storageOperations";
import { HeadlessCmsStorageOperations } from "@webiny/api-headless-cms/types";
import {
    createPageBuilderContext,
    createPageBuilderGraphQL
} from "@webiny/api-page-builder/graphql";
import { createStorageOperations as createPageBuilderStorageOperations } from "@webiny/api-page-builder-so-ddb";
import { CREATE_CATEGORY } from "./graphql/categories";
import { CREATE_PAGE, GET_PAGE } from "./graphql/pages";
import {
    CREATE_CONTENT_REVIEW_MUTATION,
    DELETE_CONTENT_REVIEW_MUTATION,
    GET_CONTENT_REVIEW_QUERY,
    LIST_CONTENT_REVIEWS_QUERY,
    PROVIDE_SIGN_OFF_MUTATION,
    RETRACT_SIGN_OFF_MUTATION
} from "./graphql/contentReview";
import { LOGIN } from "./graphql/login";
import { GET_REVIEWER_QUERY, LIST_REVIEWERS_QUERY } from "./graphql/reviewer";
import {
    CREATE_COMMENT_MUTATION,
    DELETE_COMMENT_MUTATION,
    GET_COMMENT_QUERY,
    LIST_COMMENTS_QUERY,
    UPDATE_COMMENT_MUTATION
} from "./graphql/comment";
import {
    CREATE_CHANGE_REQUEST_MUTATION,
    DELETE_CHANGE_REQUEST_MUTATION,
    GET_CHANGE_REQUEST_QUERY,
    LIST_CHANGES_REQUESTED_QUERY,
    UPDATE_CHANGE_REQUEST_MUTATION
} from "./graphql/changeRequest";

export interface CreateHeadlessCmsAppParams {
    storageOperations: HeadlessCmsStorageOperations;
}

export interface GQLHandlerCallableParams {
    setupTenancyAndSecurityGraphQL?: boolean;
    permissions?: PermissionsArg[];
    identity?: SecurityIdentity;
    plugins?: Plugin | Plugin[] | Plugin[][] | PluginCollection;
    storageOperationPlugins?: Plugin | Plugin[] | Plugin[][] | PluginCollection;
    path: string;
    createHeadlessCmsApp: (params: CreateHeadlessCmsAppParams) => any[];
}

const documentClient = new DocumentClient({
    convertEmptyValues: true,
    endpoint: process.env.MOCK_DYNAMODB_ENDPOINT || "http://localhost:8001",
    sslEnabled: false,
    region: "local",
    accessKeyId: "test",
    secretAccessKey: "test"
});

export const useGqlHandler = (params: GQLHandlerCallableParams) => {
    const ops = getStorageOperations({
        plugins: params.storageOperationPlugins || []
    });

    const tenant = {
        id: "root",
        name: "Root",
        parent: null
    };
    const {
        permissions,
        identity,
        plugins = [],
        path,
        setupTenancyAndSecurityGraphQL,
        createHeadlessCmsApp
    } = params;

    const headlessCmsApp = createHeadlessCmsApp({
        storageOperations: ops.storageOperations
    });

    const handler = createHandler({
        plugins: [
            ...ops.plugins,
            ...createTenancyAndSecurity({
                setupGraphQL: setupTenancyAndSecurityGraphQL,
                permissions: [...createPermissions(permissions), { name: "pb.*" }],
                identity
            }),
            {
                type: "context",
                name: "context-security-tenant",
                apply(context) {
                    context.security.getApiKeyByToken = async (
                        token: string
                    ): Promise<ApiKey | null> => {
                        if (!token || token !== "aToken") {
                            return null;
                        }
                        const apiKey = "a1234567890";
                        return {
                            id: apiKey,
                            name: apiKey,
                            tenant: tenant.id,
                            permissions: identity.permissions || [],
                            token,
                            createdBy: {
                                id: "test",
                                displayName: "test",
                                type: "admin"
                            },
                            description: "test",
                            createdOn: new Date().toISOString(),
                            webinyVersion: context.WEBINY_VERSION
                        };
                    };
                }
            },
            {
                type: "context",
                name: "context-path-parameters",
                apply(context) {
                    if (!context.http) {
                        context.http = {
                            request: {
                                path: {
                                    parameters: null
                                }
                            }
                        };
                    } else if (!context.http.request.path) {
                        context.http.request.path = {
                            parameters: null
                        };
                    }
                    context.http.request.path.parameters = { key: path };
                }
            },
            apiKeyAuthentication({ identityType: "api-key" }),
            apiKeyAuthorization({ identityType: "api-key" }),
            i18nContext(),
            i18nDynamoDbStorageOperations(),
            i18nContentPlugins(),
            mockLocalesPlugins(),
            createPageBuilderGraphQL(),
            createPageBuilderContext({
                storageOperations: createPageBuilderStorageOperations({ documentClient })
            }),
            ...headlessCmsApp,
            createApwContext(),
            createApwGraphQL(),
            plugins
        ],
        http: { debug: true }
    });

    const invoke = async ({ httpMethod = "POST", body, headers = {}, ...rest }) => {
        const response = await handler({
            httpMethod,
            headers,
            body: JSON.stringify(body),
            ...rest
        });
        if (httpMethod === "OPTIONS" && !response.body) {
            return [null, response];
        }
        // The first element is the response body, and the second is the raw response.
        return [JSON.parse(response.body), response];
    };

    const securityIdentity = {
        async login() {
            return invoke({ body: { query: LOGIN } });
        }
    };

    const reviewer = {
        async getReviewerQuery(variables: Record<string, any>) {
            return invoke({ body: { query: GET_REVIEWER_QUERY, variables } });
        },
        async listReviewersQuery(variables: Record<string, any>) {
            return invoke({ body: { query: LIST_REVIEWERS_QUERY, variables } });
        }
    };

    return {
        until,
        sleep,
        handler,
        invoke,
        securityIdentity,
        reviewer,
        async introspect() {
            return invoke({ body: { query: introspectionQuery } });
        },
        // Workflow
        async getWorkflowQuery(variables: Record<string, any>) {
            return invoke({ body: { query: GET_WORKFLOW_QUERY, variables } });
        },
        async listWorkflowsQuery(variables: Record<string, any>) {
            return invoke({ body: { query: LIST_WORKFLOWS_QUERY, variables } });
        },
        async createWorkflowMutation(variables: Record<string, any>) {
            return invoke({ body: { query: CREATE_WORKFLOW_MUTATION, variables } });
        },
        async updateWorkflowMutation(variables: Record<string, any>) {
            return invoke({ body: { query: UPDATE_WORKFLOW_MUTATION, variables } });
        },
        async deleteWorkflowMutation(variables: Record<string, any>) {
            return invoke({ body: { query: DELETE_WORKFLOW_MUTATION, variables } });
        },
        // Comment
        async getCommentQuery(variables: Record<string, any>) {
            return invoke({ body: { query: GET_COMMENT_QUERY, variables } });
        },
        async listCommentsQuery(variables: Record<string, any>) {
            return invoke({ body: { query: LIST_COMMENTS_QUERY, variables } });
        },
        async createCommentMutation(variables: Record<string, any>) {
            return invoke({ body: { query: CREATE_COMMENT_MUTATION, variables } });
        },
        async updateCommentMutation(variables: Record<string, any>) {
            return invoke({ body: { query: UPDATE_COMMENT_MUTATION, variables } });
        },
        async deleteCommentMutation(variables: Record<string, any>) {
            return invoke({ body: { query: DELETE_COMMENT_MUTATION, variables } });
        },
        // Change Requested
        async getChangeRequestQuery(variables: Record<string, any>) {
            return invoke({ body: { query: GET_CHANGE_REQUEST_QUERY, variables } });
        },
        async listChangeRequestsQuery(variables: Record<string, any>) {
            return invoke({ body: { query: LIST_CHANGES_REQUESTED_QUERY, variables } });
        },
        async createChangeRequestMutation(variables: Record<string, any>) {
            return invoke({ body: { query: CREATE_CHANGE_REQUEST_MUTATION, variables } });
        },
        async updateChangeRequestMutation(variables: Record<string, any>) {
            return invoke({ body: { query: UPDATE_CHANGE_REQUEST_MUTATION, variables } });
        },
        async deleteChangeRequestMutation(variables: Record<string, any>) {
            return invoke({ body: { query: DELETE_CHANGE_REQUEST_MUTATION, variables } });
        },
        // Categories
        async createCategory(variables) {
            return invoke({ body: { query: CREATE_CATEGORY, variables } });
        },
        // Pages
        async createPage(variables) {
            return invoke({ body: { query: CREATE_PAGE, variables } });
        },
        async getPageQuery(variables) {
            return invoke({ body: { query: GET_PAGE, variables } });
        },
        // Content Review
        async getContentReviewQuery(variables: Record<string, any>) {
            return invoke({ body: { query: GET_CONTENT_REVIEW_QUERY, variables } });
        },
        async listContentReviewsQuery(variables: Record<string, any>) {
            return invoke({ body: { query: LIST_CONTENT_REVIEWS_QUERY, variables } });
        },
        async createContentReviewMutation(variables: Record<string, any>) {
            return invoke({ body: { query: CREATE_CONTENT_REVIEW_MUTATION, variables } });
        },
        async deleteContentReviewMutation(variables: Record<string, any>) {
            return invoke({ body: { query: DELETE_CONTENT_REVIEW_MUTATION, variables } });
        },
        async provideSignOffMutation(variables: Record<string, any>) {
            return invoke({ body: { query: PROVIDE_SIGN_OFF_MUTATION, variables } });
        },
        async retractSignOffMutation(variables: Record<string, any>) {
            return invoke({ body: { query: RETRACT_SIGN_OFF_MUTATION, variables } });
        }
    };
};
