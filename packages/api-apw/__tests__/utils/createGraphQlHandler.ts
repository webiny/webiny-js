import { getIntrospectionQuery } from "graphql";
import { createWcpContext, createWcpGraphQL } from "@webiny/api-wcp";
import createGraphQLHandler from "@webiny/handler-graphql";
import { createI18NContext, createI18NGraphQL } from "@webiny/api-i18n";
import { createHandler } from "@webiny/handler-aws";
import { mockLocalesPlugins } from "@webiny/api-i18n/graphql/testing";
import { SecurityIdentity } from "@webiny/api-security/types";
import apiKeyAuthentication from "@webiny/api-security/plugins/apiKeyAuthentication";
import apiKeyAuthorization from "@webiny/api-security/plugins/apiKeyAuthorization";
import { createPermissions, PermissionsArg, sleep, until } from "./helpers";
import {
    CREATE_WORKFLOW_MUTATION,
    DELETE_WORKFLOW_MUTATION,
    GET_WORKFLOW_QUERY,
    LIST_WORKFLOWS_QUERY,
    UPDATE_WORKFLOW_MUTATION
} from "./graphql/workflow";
import { Plugin, PluginCollection } from "@webiny/plugins/types";
import { createApwGraphQL, createApwPageBuilderContext } from "~/index";
import {
    CmsParametersPlugin,
    createHeadlessCmsContext,
    createHeadlessCmsGraphQL
} from "@webiny/api-headless-cms";
import { createTenancyAndSecurity } from "./tenancySecurity";
import {
    createPageBuilderContext,
    createPageBuilderGraphQL
} from "@webiny/api-page-builder/graphql";
import { CREATE_CATEGORY, GET_CATEGORY } from "./graphql/categories";
import { CREATE_PAGE, DELETE_PAGE, GET_PAGE, PUBLISH_PAGE, UPDATE_PAGE } from "./graphql/pages";
import {
    CREATE_CONTENT_REVIEW_MUTATION,
    DELETE_CONTENT_REVIEW_MUTATION,
    DELETE_SCHEDULED_ACTION_MUTATION,
    GET_CONTENT_REVIEW_QUERY,
    IS_REVIEW_REQUIRED_QUERY,
    LIST_CONTENT_REVIEWS_QUERY,
    PROVIDE_SIGN_OFF_MUTATION,
    PUBLISH_CONTENT_MUTATION,
    RETRACT_SIGN_OFF_MUTATION,
    UNPUBLISH_CONTENT_MUTATION
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
import { contextCommon, contextSecurity } from "./context";
import { createDummyTransport, createTransport } from "@webiny/api-mailer";
import { CREATE_CONTENT_MODEL_GROUP_MUTATION } from "~tests/utils/graphql/cms.group";
import { CREATE_CONTENT_MODEL_MUTATION } from "~tests/utils/graphql/cms.model";
import { CmsModel, HeadlessCmsStorageOperations } from "@webiny/api-headless-cms/types";
import {
    contentEntryCreateFromMutationFactory,
    contentEntryCreateMutationFactory,
    contentEntryGetQueryFactory,
    contentEntryUpdateMutationFactory
} from "~tests/utils/graphql/cms.entry";
import { getStorageOps } from "@webiny/project-utils/testing/environment";
import { PageBuilderStorageOperations } from "@webiny/api-page-builder/types";
import { ApwScheduleActionStorageOperations } from "~/scheduler/types";
import { APIGatewayEvent, LambdaContext } from "@webiny/handler-aws/types";

export interface GQLHandlerCallableParams {
    setupTenancyAndSecurityGraphQL?: boolean;
    permissions?: PermissionsArg[];
    identity?: SecurityIdentity;
    plugins?: Plugin | Plugin[] | Plugin[][] | PluginCollection;
    storageOperationPlugins?: Plugin | Plugin[] | Plugin[][] | PluginCollection;
    path: `/cms/manage/${string}` | `/cms/preview/${string}` | `/cms/read/${string}` | "/graphql";
}

export interface InvokeParams {
    httpMethod?: "POST" | "GET" | "OPTIONS";
    body: {
        query: string;
        variables?: Record<string, any>;
    };
    headers?: Record<string, string>;
}

const validateIsCmsPath = (params: GQLHandlerCallableParams): void => {
    if (params.path.match("^/cms/") !== null) {
        return;
    }
    throw new Error(`Path is not a CMS path: ${params.path}`);
};

const validateIsCoreGraphQlPath = (params: GQLHandlerCallableParams): void => {
    if (params.path.match("^/graphql$") !== null) {
        return;
    }
    throw new Error(`Path is not a Core GraphQL path: ${params.path}`);
};

export const createGraphQlHandler = (params: GQLHandlerCallableParams) => {
    const { permissions, identity, plugins = [] } = params;

    const apwScheduleStorage = getStorageOps<ApwScheduleActionStorageOperations>("apwSchedule");
    const cmsStorage = getStorageOps<HeadlessCmsStorageOperations>("cms");
    const pageBuilderStorage = getStorageOps<PageBuilderStorageOperations>("pageBuilder");
    const i18nStorage = getStorageOps<any[]>("i18n");

    const handler = createHandler({
        plugins: [
            ...apwScheduleStorage.plugins,
            ...cmsStorage.plugins,
            createTransport(async () => {
                const plugin = await createDummyTransport();
                plugin.name = "dummy-default.test";
                return plugin;
            }),
            createGraphQLHandler(),
            createWcpContext(),
            createWcpGraphQL(),
            contextCommon(),
            ...createTenancyAndSecurity({
                permissions: [...createPermissions(permissions), { name: "pb.*" }],
                identity
            }),
            contextSecurity({ identity }),
            apiKeyAuthentication({ identityType: "api-key" }),
            apiKeyAuthorization({ identityType: "api-key" }),
            createI18NContext(),
            createI18NGraphQL(),
            /**
             * for the page builder we must define the current locale and type
             * we can do that via the CmsParametersPlugin
             */
            new CmsParametersPlugin(async context => {
                const locale = context.i18n.getContentLocale()?.code || "en-US";
                return {
                    /**
                     * This will be fixed with type augmenting.
                     * Currently, request.params.type is unknown.
                     */
                    // @ts-expect-error
                    type: context.request?.params?.type || "read",
                    locale
                };
            }),
            ...i18nStorage.storageOperations,
            mockLocalesPlugins(),
            createPageBuilderGraphQL(),
            createPageBuilderContext({
                storageOperations: pageBuilderStorage.storageOperations
            }),
            createHeadlessCmsContext({
                storageOperations: cmsStorage.storageOperations
            }),
            createHeadlessCmsGraphQL(),
            createApwPageBuilderContext({
                storageOperations: apwScheduleStorage.storageOperations
            }),
            createApwGraphQL(),
            plugins
        ],
        debug: false
    });

    const invoke = async ({ httpMethod = "POST", body, headers = {}, ...rest }: InvokeParams) => {
        const response = await handler(
            {
                path: params.path,
                httpMethod,
                headers: {
                    ["x-tenant"]: "root",
                    ["Content-Type"]: "application/json",
                    ...headers
                },
                body: JSON.stringify(body),
                ...rest
            } as unknown as APIGatewayEvent,
            {} as LambdaContext
        );
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
            return invoke({
                body: { query: LIST_REVIEWERS_QUERY, variables }
            });
        }
    };

    return {
        params,
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
            validateIsCoreGraphQlPath(params);
            return invoke({ body: { query: GET_WORKFLOW_QUERY, variables } });
        },
        async listWorkflowsQuery(variables: Record<string, any> = {}) {
            validateIsCoreGraphQlPath(params);
            return invoke({ body: { query: LIST_WORKFLOWS_QUERY, variables } });
        },
        async createWorkflowMutation(variables: Record<string, any>) {
            validateIsCoreGraphQlPath(params);
            return invoke({ body: { query: CREATE_WORKFLOW_MUTATION, variables } });
        },
        async updateWorkflowMutation(variables: Record<string, any>) {
            validateIsCoreGraphQlPath(params);
            return invoke({ body: { query: UPDATE_WORKFLOW_MUTATION, variables } });
        },
        async deleteWorkflowMutation(variables: Record<string, any>) {
            validateIsCoreGraphQlPath(params);
            return invoke({ body: { query: DELETE_WORKFLOW_MUTATION, variables } });
        },
        // Comment
        async getCommentQuery(variables: Record<string, any>) {
            validateIsCoreGraphQlPath(params);
            return invoke({ body: { query: GET_COMMENT_QUERY, variables } });
        },
        async listCommentsQuery(variables: Record<string, any>) {
            validateIsCoreGraphQlPath(params);
            return invoke({ body: { query: LIST_COMMENTS_QUERY, variables } });
        },
        async createCommentMutation(variables: Record<string, any>) {
            validateIsCoreGraphQlPath(params);
            return invoke({ body: { query: CREATE_COMMENT_MUTATION, variables } });
        },
        async updateCommentMutation(variables: Record<string, any>) {
            validateIsCoreGraphQlPath(params);
            return invoke({ body: { query: UPDATE_COMMENT_MUTATION, variables } });
        },
        async deleteCommentMutation(variables: Record<string, any>) {
            validateIsCoreGraphQlPath(params);
            return invoke({ body: { query: DELETE_COMMENT_MUTATION, variables } });
        },
        // Change Requested
        async getChangeRequestQuery(variables: Record<string, any>) {
            validateIsCoreGraphQlPath(params);
            return invoke({ body: { query: GET_CHANGE_REQUEST_QUERY, variables } });
        },
        async listChangeRequestsQuery(variables: Record<string, any>) {
            validateIsCoreGraphQlPath(params);
            return invoke({ body: { query: LIST_CHANGES_REQUESTED_QUERY, variables } });
        },
        async createChangeRequestMutation(variables: Record<string, any>) {
            validateIsCoreGraphQlPath(params);
            return invoke({ body: { query: CREATE_CHANGE_REQUEST_MUTATION, variables } });
        },
        async updateChangeRequestMutation(variables: Record<string, any>) {
            validateIsCoreGraphQlPath(params);
            return invoke({ body: { query: UPDATE_CHANGE_REQUEST_MUTATION, variables } });
        },
        async deleteChangeRequestMutation(variables: Record<string, any>) {
            validateIsCoreGraphQlPath(params);
            return invoke({ body: { query: DELETE_CHANGE_REQUEST_MUTATION, variables } });
        },
        // Categories
        async getCategory(variables: Record<string, any>) {
            validateIsCoreGraphQlPath(params);
            return invoke({ body: { query: GET_CATEGORY, variables } });
        },
        async createCategory(variables: Record<string, any>) {
            validateIsCoreGraphQlPath(params);
            return invoke({ body: { query: CREATE_CATEGORY, variables } });
        },
        // Pages
        async createPage(variables: Record<string, any>) {
            validateIsCoreGraphQlPath(params);
            return invoke({ body: { query: CREATE_PAGE, variables } });
        },
        async updatePage(variables: Record<string, any>) {
            validateIsCoreGraphQlPath(params);
            return invoke({ body: { query: UPDATE_PAGE, variables } });
        },
        async publishPage(variables: Record<string, any>) {
            validateIsCoreGraphQlPath(params);
            return invoke({ body: { query: PUBLISH_PAGE, variables } });
        },
        async getPageQuery(variables: Record<string, any>) {
            validateIsCoreGraphQlPath(params);
            return invoke({ body: { query: GET_PAGE, variables } });
        },
        async deletePageMutation(variables: Record<string, any>) {
            validateIsCoreGraphQlPath(params);
            return invoke({ body: { query: DELETE_PAGE, variables } });
        },
        // Content Review
        async isReviewRequiredQuery(variables: Record<string, any>) {
            validateIsCoreGraphQlPath(params);
            return invoke({ body: { query: IS_REVIEW_REQUIRED_QUERY, variables } });
        },
        async getContentReviewQuery(variables: Record<string, any>) {
            validateIsCoreGraphQlPath(params);
            return invoke({ body: { query: GET_CONTENT_REVIEW_QUERY, variables } });
        },
        async listContentReviewsQuery(variables: Record<string, any>) {
            validateIsCoreGraphQlPath(params);
            return invoke({ body: { query: LIST_CONTENT_REVIEWS_QUERY, variables } });
        },
        async createContentReviewMutation(variables: Record<string, any>) {
            validateIsCoreGraphQlPath(params);
            return invoke({ body: { query: CREATE_CONTENT_REVIEW_MUTATION, variables } });
        },
        async deleteContentReviewMutation(variables: Record<string, any>) {
            validateIsCoreGraphQlPath(params);
            return invoke({ body: { query: DELETE_CONTENT_REVIEW_MUTATION, variables } });
        },
        async provideSignOffMutation(variables: Record<string, any>) {
            validateIsCoreGraphQlPath(params);
            return invoke({ body: { query: PROVIDE_SIGN_OFF_MUTATION, variables } });
        },
        async retractSignOffMutation(variables: Record<string, any>) {
            validateIsCoreGraphQlPath(params);
            return invoke({ body: { query: RETRACT_SIGN_OFF_MUTATION, variables } });
        },
        async publishContentMutation(variables: Record<string, any>) {
            validateIsCoreGraphQlPath(params);
            return invoke({ body: { query: PUBLISH_CONTENT_MUTATION, variables } });
        },
        async unpublishContentMutation(variables: Record<string, any>) {
            validateIsCoreGraphQlPath(params);
            return invoke({ body: { query: UNPUBLISH_CONTENT_MUTATION, variables } });
        },
        async deleteScheduledActionMutation(variables: Record<string, any>) {
            validateIsCoreGraphQlPath(params);
            return invoke({ body: { query: DELETE_SCHEDULED_ACTION_MUTATION, variables } });
        },
        /**
         * Headless CMS
         */
        async createContentModelGroupMutation(variables: Record<string, any>) {
            validateIsCmsPath(params);
            return invoke({
                body: {
                    query: CREATE_CONTENT_MODEL_GROUP_MUTATION,
                    variables
                }
            });
        },
        async createContentModelMutation(variables: Record<string, any>) {
            validateIsCmsPath(params);
            return invoke({
                body: {
                    query: CREATE_CONTENT_MODEL_MUTATION,
                    variables
                }
            });
        },
        async createContentEntryMutation(model: CmsModel, variables: Record<string, any>) {
            validateIsCmsPath(params);
            return invoke({
                body: {
                    query: contentEntryCreateMutationFactory(model),
                    variables
                }
            });
        },
        async updateContentEntryMutation(model: CmsModel, variables: Record<string, any>) {
            validateIsCmsPath(params);
            return invoke({
                body: {
                    query: contentEntryUpdateMutationFactory(model),
                    variables
                }
            });
        },
        async createContentEntryFromMutation(model: CmsModel, variables: Record<string, any>) {
            validateIsCmsPath(params);
            return invoke({
                body: {
                    query: contentEntryCreateFromMutationFactory(model),
                    variables
                }
            });
        },
        async getContentEntryQuery(model: CmsModel, variables: Record<string, any>) {
            validateIsCmsPath(params);
            return invoke({
                body: {
                    query: contentEntryGetQueryFactory(model),
                    variables
                }
            });
        }
    };
};
