import path from "path";
import fs from "fs";
import { createHandler } from "@webiny/handler-aws";
import graphqlHandlerPlugins from "@webiny/handler-graphql";
import fileManagerPlugins from "@webiny/api-file-manager/plugins";
import fileManagerDynamoDbPlugins from "@webiny/api-file-manager-ddb";
import i18nContext from "@webiny/api-i18n/graphql/context";
import i18nDynamoDbStorageOperations from "@webiny/api-i18n-ddb";
import { mockLocalesPlugins } from "@webiny/api-i18n/graphql/testing";
import { SecurityIdentity } from "@webiny/api-security/types";
import { createFormBuilder } from "~/index";
// Graphql
import { INSTALL as INSTALL_FILE_MANAGER } from "./graphql/fileManagerSettings";
import {
    GET_SETTINGS,
    UPDATE_SETTINGS,
    INSTALL,
    IS_INSTALLED
} from "./graphql/formBuilderSettings";
import {
    CREATE_FROM,
    CREATE_REVISION_FROM,
    DELETE_FORM,
    UPDATE_REVISION,
    PUBLISH_REVISION,
    UNPUBLISH_REVISION,
    DELETE_REVISION,
    SAVE_FORM_VIEW,
    GET_FORM,
    GET_FORM_REVISIONS,
    LIST_FORMS,
    GET_PUBLISHED_FORM
} from "./graphql/forms";
import {
    CREATE_FROM_SUBMISSION,
    LIST_FROM_SUBMISSIONS,
    EXPORT_FORM_SUBMISSIONS
} from "./graphql/formSubmission";
import { SecurityPermission } from "@webiny/api-security/types";
import { until } from "@webiny/project-utils/testing/helpers/until";
import { createTenancyAndSecurity } from "./tenancySecurity";
import { PluginCollection } from "@webiny/plugins/types";

export interface UseGqlHandlerParams {
    permissions?: SecurityPermission[];
    identity?: SecurityIdentity | null;
    plugins?: PluginCollection;
}

interface InvokeParams {
    httpMethod?: "POST";
    body: {
        query: string;
        variables?: Record<string, any>;
    };
    headers?: Record<string, string>;
}

const defaultIdentity: SecurityIdentity = {
    id: "12345678",
    type: "admin",
    displayName: "John Doe"
};

export default (params: UseGqlHandlerParams = {}) => {
    const { permissions, identity, plugins = [] } = params;
    // @ts-ignore
    if (typeof __getStorageOperations !== "function") {
        throw new Error(`There is no global "__getStorageOperations" function.`);
    }
    // @ts-ignore
    const { createStorageOperations, getGlobalPlugins } = __getStorageOperations();
    if (typeof createStorageOperations !== "function") {
        throw new Error(
            `A product of "__getStorageOperations" must be a function to initialize storage operations.`
        );
    }
    if (typeof getGlobalPlugins === "function") {
        plugins.push(...getGlobalPlugins());
    }

    const handler = createHandler(
        ...plugins,
        graphqlHandlerPlugins(),
        ...createTenancyAndSecurity({ permissions, identity: identity || defaultIdentity }),
        i18nContext(),
        i18nDynamoDbStorageOperations(),
        mockLocalesPlugins(),
        fileManagerPlugins(),
        fileManagerDynamoDbPlugins(),
        /**
         * We need to create the form builder API app.
         * It requires storage operations and plugins from the storage operations.
         */
        createFormBuilder({
            storageOperations: createStorageOperations()
        }),
        {
            type: "api-file-manager-storage",
            name: "api-file-manager-storage",
            async upload(args: any) {
                // TODO: use tmp OS directory
                const key = path.join(__dirname, args.name);

                fs.writeFileSync(key, args.buffer);

                return {
                    file: {
                        key: args.name,
                        name: args.name,
                        type: args.type,
                        size: args.size
                    }
                };
            },
            async delete() {
                // dummy
            }
        }
    );

    // Let's also create the "invoke" function. This will make handler invocations in actual tests easier and nicer.
    const invoke = async ({ httpMethod = "POST", body, headers = {}, ...rest }: InvokeParams) => {
        const response = await handler({
            httpMethod,
            headers,
            body: JSON.stringify(body),
            ...rest
        });

        // The first element is the response body, and the second is the raw response.
        return [JSON.parse(response.body), response];
    };

    return {
        until,
        sleep: (ms = 100) => {
            return new Promise(resolve => {
                setTimeout(resolve, ms);
            });
        },
        handler,
        invoke,
        defaultIdentity,
        // Form builder settings
        async updateSettings(variables: Record<string, any> = {}) {
            return invoke({ body: { query: UPDATE_SETTINGS, variables } });
        },
        async getSettings(variables: Record<string, any> = {}) {
            return invoke({ body: { query: GET_SETTINGS, variables } });
        },
        // Install Form builder
        async install(variables: Record<string, any> = {}) {
            return invoke({ body: { query: INSTALL, variables } });
        },
        async isInstalled(variables: Record<string, any> = {}) {
            return invoke({ body: { query: IS_INSTALLED, variables } });
        },
        // Install File Manager
        async installFileManager(variables: Record<string, any>) {
            return invoke({ body: { query: INSTALL_FILE_MANAGER, variables } });
        },
        // Forms
        async createForm(variables: Record<string, any>) {
            return invoke({ body: { query: CREATE_FROM, variables } });
        },
        async createRevisionFrom(variables: Record<string, any>) {
            return invoke({ body: { query: CREATE_REVISION_FROM, variables } });
        },
        async deleteForm(variables: Record<string, any>) {
            return invoke({ body: { query: DELETE_FORM, variables } });
        },
        async updateRevision(variables: Record<string, any>) {
            return invoke({ body: { query: UPDATE_REVISION, variables } });
        },
        async publishRevision(variables: Record<string, any>) {
            return invoke({ body: { query: PUBLISH_REVISION, variables } });
        },
        async unpublishRevision(variables: Record<string, any>) {
            return invoke({ body: { query: UNPUBLISH_REVISION, variables } });
        },
        async deleteRevision(variables: Record<string, any>) {
            return invoke({ body: { query: DELETE_REVISION, variables } });
        },
        async saveFormView(variables: Record<string, any>) {
            return invoke({ body: { query: SAVE_FORM_VIEW, variables } });
        },
        async getForm(variables: Record<string, any>) {
            return invoke({ body: { query: GET_FORM, variables } });
        },
        async getFormRevisions(variables: Record<string, any>) {
            return invoke({ body: { query: GET_FORM_REVISIONS, variables } });
        },
        async getPublishedForm(variables: Record<string, any>) {
            return invoke({ body: { query: GET_PUBLISHED_FORM, variables } });
        },
        async listForms(variables: Record<string, any> = {}) {
            return invoke({ body: { query: LIST_FORMS, variables } });
        },
        // Form Submission
        async createFormSubmission(variables: Record<string, any>) {
            return invoke({ body: { query: CREATE_FROM_SUBMISSION, variables } });
        },
        async listFormSubmissions(variables: Record<string, any>) {
            return invoke({ body: { query: LIST_FROM_SUBMISSIONS, variables } });
        },
        async exportFormSubmissions(variables: Record<string, any>) {
            return invoke({ body: { query: EXPORT_FORM_SUBMISSIONS, variables } });
        }
    };
};
