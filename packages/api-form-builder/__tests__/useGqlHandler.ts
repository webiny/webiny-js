import path from "path";
import fs from "fs";
import { createWcpContext, createWcpGraphQL } from "@webiny/api-wcp";
import { createHandler } from "@webiny/handler-aws/gateway";
import graphqlHandlerPlugins from "@webiny/handler-graphql";
import { createFileManagerContext, createFileManagerGraphQL } from "@webiny/api-file-manager";
import i18nContext from "@webiny/api-i18n/graphql/context";
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
import { createTenancyAndSecurity, defaultIdentity } from "./tenancySecurity";
import { PluginCollection } from "@webiny/plugins/types";
import { getStorageOps } from "@webiny/project-utils/testing/environment";
import { FileManagerStorageOperations } from "@webiny/api-file-manager/types";
import { FormBuilderStorageOperations } from "~/types";

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

export default (params: UseGqlHandlerParams = {}) => {
    const { permissions, identity, plugins = [] } = params;
    const i18nStorage = getStorageOps("i18n");
    const fileManagerStorage = getStorageOps<FileManagerStorageOperations>("fileManager");
    const formBuilderStorage = getStorageOps<FormBuilderStorageOperations>("formBuilder");

    const handler = createHandler({
        plugins: [
            ...plugins,
            ...formBuilderStorage.plugins,
            createWcpContext(),
            createWcpGraphQL(),
            graphqlHandlerPlugins(),
            ...createTenancyAndSecurity({ permissions, identity }),
            i18nContext(),
            i18nStorage.storageOperations as any,
            mockLocalesPlugins(),
            createFileManagerContext({
                storageOperations: fileManagerStorage.storageOperations
            }),
            createFileManagerGraphQL(),
            createFormBuilder({
                storageOperations: formBuilderStorage.storageOperations
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
        ]
    });

    // Let's also create the "invoke" function. This will make handler invocations in actual tests easier and nicer.
    const invoke = async ({ httpMethod = "POST", body, headers = {}, ...rest }: InvokeParams) => {
        const response = await handler(
            {
                path: "/graphql",
                httpMethod,
                headers: {
                    ["x-tenant"]: "root",
                    ["Content-Type"]: "application/json",
                    ...headers
                },
                body: JSON.stringify(body),
                ...rest
            } as any,
            {} as any
        );

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
