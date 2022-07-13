import { getIntrospectionQuery } from "graphql";
import { DocumentClient } from "aws-sdk/clients/dynamodb";
import i18nContext from "@webiny/api-i18n/graphql/context";
import { createHandler } from "@webiny/handler-aws";
import { mockLocalesPlugins } from "@webiny/api-i18n/graphql/testing";
import { SecurityIdentity } from "@webiny/api-security/types";
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
import { createApwHeadlessCmsContext, createApwGraphQL } from "~/index";
import { createStorageOperations as createHeadlessCmsStorageOperations } from "@webiny/api-headless-cms-ddb";
import { createHeadlessCmsContext, createHeadlessCmsGraphQL } from "@webiny/api-headless-cms";
/**
 * Unfortunately at we need to import the api-i18n-ddb package manually
 */
import i18nDynamoDbStorageOperations from "@webiny/api-i18n-ddb";
import { createTenancyAndSecurity } from "./tenancySecurity";
import { getStorageOperations } from "./storageOperations";
import { CmsModel } from "@webiny/api-headless-cms/types";
import {
    CREATE_CONTENT_REVIEW_MUTATION,
    DELETE_CONTENT_REVIEW_MUTATION,
    GET_CONTENT_REVIEW_QUERY,
    LIST_CONTENT_REVIEWS_QUERY,
    PROVIDE_SIGN_OFF_MUTATION,
    RETRACT_SIGN_OFF_MUTATION,
    IS_REVIEW_REQUIRED_QUERY,
    PUBLISH_CONTENT_MUTATION,
    UNPUBLISH_CONTENT_MUTATION,
    DELETE_SCHEDULED_ACTION_MUTATION
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
import { CREATE_CONTENT_MODEL_GROUP_MUTATION } from "./graphql/cms.group";
import { CREATE_CONTENT_MODEL_MUTATION } from "./graphql/cms.model";
import {
    contentEntryCreateFromMutationFactory,
    contentEntryCreateMutationFactory,
    contentEntryGetQueryFactory,
    contentEntryUpdateMutationFactory
} from "./graphql/cms.entry";
import { contextSecurity, contextCommon } from "./context";

export interface CreateHeadlessCmsGQLHandlerParams {
    permissions?: PermissionsArg[];
    identity?: SecurityIdentity;
    plugins?: Plugin | Plugin[] | Plugin[][] | PluginCollection;
    storageOperationPlugins?: Plugin | Plugin[] | Plugin[][] | PluginCollection;
    path: string;
}

export interface InvokeParams {
    httpMethod?: "POST" | "GET" | "OPTIONS";
    body: {
        query: string;
        variables?: Record<string, any>;
    };
    headers?: Record<string, string>;
}

const documentClient = new DocumentClient({
    convertEmptyValues: true,
    endpoint: process.env.MOCK_DYNAMODB_ENDPOINT || "http://localhost:8001",
    sslEnabled: false,
    region: "local",
    accessKeyId: "test",
    secretAccessKey: "test"
});

export const createHeadlessCmsGQLHandler = (params: CreateHeadlessCmsGQLHandlerParams) => {
    const ops = getStorageOperations({
        plugins: params.storageOperationPlugins || [],
        documentClient
    });

    const tenant = {
        id: "root",
        name: "Root",
        parent: null
    };
    const { permissions, identity, plugins = [] } = params;
    /**
     * We're using ddb-only storageOperations here because current jest setup doesn't allow
     * usage of more than one storageOperations at a time with the help of --keyword flag.
     */
    const headlessCmsApp = createHeadlessCmsContext({
        storageOperations: createHeadlessCmsStorageOperations({
            documentClient
        })
    });

    const handler = createHandler({
        plugins: [
            contextCommon(params),
            ...ops.plugins,
            ...createTenancyAndSecurity({
                permissions: [...createPermissions(permissions), { name: "pb.*" }],
                identity
            }),
            contextSecurity({ tenant, identity }),
            apiKeyAuthentication({ identityType: "api-key" }),
            apiKeyAuthorization({ identityType: "api-key" }),
            i18nContext(),
            i18nDynamoDbStorageOperations(),
            mockLocalesPlugins(),
            ...headlessCmsApp,
            createHeadlessCmsGraphQL(),
            createApwHeadlessCmsContext({
                storageOperations: ops.storageOperations
            }),
            createApwGraphQL(),
            plugins
        ],
        http: { debug: true }
    });

    const invoke = async ({ httpMethod = "POST", body, headers = {}, ...rest }: InvokeParams) => {
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
            return invoke({ body: { query: getIntrospectionQuery() } });
        },
        // Workflow
        async getWorkflowQuery(variables: Record<string, any>) {
            return invoke({ body: { query: GET_WORKFLOW_QUERY, variables } });
        },
        async listWorkflowsQuery(variables: Record<string, any> = {}) {
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
        // Content Review
        async isReviewRequiredQuery(variables: Record<string, any>) {
            return invoke({ body: { query: IS_REVIEW_REQUIRED_QUERY, variables } });
        },
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
        },
        async publishContentMutation(variables: Record<string, any>) {
            return invoke({ body: { query: PUBLISH_CONTENT_MUTATION, variables } });
        },
        async unpublishContentMutation(variables: Record<string, any>) {
            return invoke({ body: { query: UNPUBLISH_CONTENT_MUTATION, variables } });
        },
        async deleteScheduledActionMutation(variables: Record<string, any>) {
            return invoke({ body: { query: DELETE_SCHEDULED_ACTION_MUTATION, variables } });
        },
        /**
         * Headless CMS
         */
        async createContentModelGroupMutation(variables: Record<string, any>) {
            return invoke({
                body: {
                    query: CREATE_CONTENT_MODEL_GROUP_MUTATION,
                    variables
                }
            });
        },
        async createContentModelMutation(variables: Record<string, any>) {
            return invoke({
                body: {
                    query: CREATE_CONTENT_MODEL_MUTATION,
                    variables
                }
            });
        },
        async createContentEntryMutation(model: CmsModel, variables: Record<string, any>) {
            return invoke({
                body: {
                    query: contentEntryCreateMutationFactory(model),
                    variables
                }
            });
        },
        async updateContentEntryMutation(model: CmsModel, variables: Record<string, any>) {
            return invoke({
                body: {
                    query: contentEntryUpdateMutationFactory(model),
                    variables
                }
            });
        },
        async createContentEntryFromMutation(model: CmsModel, variables: Record<string, any>) {
            return invoke({
                body: {
                    query: contentEntryCreateFromMutationFactory(model),
                    variables
                }
            });
        },
        async getContentEntryQuery(model: CmsModel, variables: Record<string, any>) {
            return invoke({
                body: {
                    query: contentEntryGetQueryFactory(model),
                    variables
                }
            });
        }
    };
};
