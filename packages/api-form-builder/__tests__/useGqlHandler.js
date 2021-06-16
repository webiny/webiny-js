import path from "path";
import fs from "fs";
import { createHandler } from "@webiny/handler-aws";
import graphqlHandlerPlugins from "@webiny/handler-graphql";
import tenancyPlugins from "@webiny/api-tenancy";
import securityPlugins from "@webiny/api-security";
import fileManagerPlugins from "@webiny/api-file-manager/plugins";
import dbPlugins from "@webiny/handler-db";
import i18nContext from "@webiny/api-i18n/graphql/context";
import i18nContentPlugins from "@webiny/api-i18n-content/plugins";
import { mockLocalesPlugins } from "@webiny/api-i18n/graphql/testing";
import { DynamoDbDriver } from "@webiny/db-dynamodb";
import { DocumentClient } from "aws-sdk/clients/dynamodb";
import { SecurityIdentity } from "@webiny/api-security";
import elasticSearch from "@webiny/api-plugin-elastic-search-client";
import { simulateStream } from "@webiny/project-utils/testing/dynamodb";
import dynamoToElastic from "@webiny/api-dynamodb-to-elasticsearch/handler";
import { Client } from "@elastic/elasticsearch";
import formBuilderPlugins from "../src/plugins";
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

const defaultTenant = { id: "root", name: "Root", parent: null };

const until = async (execute, until, options = {}) => {
    const tries = options.tries ?? 5;
    const wait = options.wait ?? 333;

    let result;
    let triesCount = 0;

    while (true) {
        result = await execute();

        let done;
        try {
            done = await until(result);
        } catch {}

        if (done) {
            return result;
        }

        triesCount++;
        if (triesCount === tries) {
            break;
        }

        // Wait.
        await new Promise(resolve => {
            setTimeout(() => resolve(), wait);
        });
    }

    throw new Error(
        `Tried ${tries} times but failed. Last result that was received: ${JSON.stringify(
            result,
            null,
            2
        )}`
    );
};

const ELASTICSEARCH_PORT = process.env.ELASTICSEARCH_PORT || "9200";

export default ({ permissions, identity, tenant } = {}) => {
    const documentClient = new DocumentClient({
        convertEmptyValues: true,
        endpoint: process.env.MOCK_DYNAMODB_ENDPOINT,
        sslEnabled: false,
        region: "local"
    });

    const elasticSearchContext = elasticSearch({
        endpoint: `http://localhost:${ELASTICSEARCH_PORT}`
    });

    // Intercept DocumentClient operations and trigger dynamoToElastic function (almost like a DynamoDB Stream trigger)
    simulateStream(documentClient, createHandler(elasticSearchContext, dynamoToElastic()));

    const handler = createHandler(
        dbPlugins({
            table: "FormBuilder",
            driver: new DynamoDbDriver({ documentClient })
        }),
        elasticSearchContext,
        graphqlHandlerPlugins(),
        tenancyPlugins(),
        securityPlugins(),
        {
            type: "context",
            apply(context) {
                context.tenancy.getCurrentTenant = () => {
                    return tenant || defaultTenant;
                };
            }
        },
        i18nContext(),
        i18nContentPlugins(),
        mockLocalesPlugins(),
        fileManagerPlugins(),
        formBuilderPlugins(),
        {
            type: "security-authorization",
            name: "security-authorization",
            getPermissions: () => permissions || [{ name: "*" }]
        },
        {
            type: "security-authentication",
            authenticate: () =>
                identity ||
                new SecurityIdentity({
                    id: "mocked",
                    displayName: "Mocked Identity",
                    type: "admin"
                })
        },
        {
            type: "api-file-manager-storage",
            name: "api-file-manager-storage",
            async upload(args) {
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
            // eslint-disable-next-line
            async delete(args) {}
        }
    );

    // Let's also create the "invoke" function. This will make handler invocations in actual tests easier and nicer.
    const invoke = async ({ httpMethod = "POST", body, headers = {}, ...rest }) => {
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
        elasticSearch: new Client({
            hosts: [`http://localhost:${ELASTICSEARCH_PORT}`],
            node: `http://localhost:${ELASTICSEARCH_PORT}`
        }),
        sleep: (ms = 100) => {
            return new Promise(resolve => {
                setTimeout(resolve, ms);
            });
        },
        handler,
        invoke,
        // Form builder settings
        async updateSettings(variables) {
            return invoke({ body: { query: UPDATE_SETTINGS, variables } });
        },
        async getSettings(variables) {
            return invoke({ body: { query: GET_SETTINGS, variables } });
        },
        // Install Form builder
        async install(variables) {
            return invoke({ body: { query: INSTALL, variables } });
        },
        async isInstalled(variables) {
            return invoke({ body: { query: IS_INSTALLED, variables } });
        },
        // Install File Manager
        async installFileManager(variables) {
            return invoke({ body: { query: INSTALL_FILE_MANAGER, variables } });
        },
        // Forms
        async createForm(variables) {
            return invoke({ body: { query: CREATE_FROM, variables } });
        },
        async createRevisionFrom(variables) {
            return invoke({ body: { query: CREATE_REVISION_FROM, variables } });
        },
        async deleteForm(variables) {
            return invoke({ body: { query: DELETE_FORM, variables } });
        },
        async updateRevision(variables) {
            return invoke({ body: { query: UPDATE_REVISION, variables } });
        },
        async publishRevision(variables) {
            return invoke({ body: { query: PUBLISH_REVISION, variables } });
        },
        async unpublishRevision(variables) {
            return invoke({ body: { query: UNPUBLISH_REVISION, variables } });
        },
        async deleteRevision(variables) {
            return invoke({ body: { query: DELETE_REVISION, variables } });
        },
        async saveFormView(variables) {
            return invoke({ body: { query: SAVE_FORM_VIEW, variables } });
        },
        async getForm(variables) {
            return invoke({ body: { query: GET_FORM, variables } });
        },
        async getFormRevisions(variables) {
            return invoke({ body: { query: GET_FORM_REVISIONS, variables } });
        },
        async getPublishedForm(variables) {
            return invoke({ body: { query: GET_PUBLISHED_FORM, variables } });
        },
        async listForms(variables = {}) {
            return invoke({ body: { query: LIST_FORMS, variables } });
        },
        // Form Submission
        async createFormSubmission(variables) {
            return invoke({ body: { query: CREATE_FROM_SUBMISSION, variables } });
        },
        async listFormSubmissions(variables) {
            return invoke({ body: { query: LIST_FROM_SUBMISSIONS, variables } });
        },
        async exportFormSubmissions(variables) {
            return invoke({ body: { query: EXPORT_FORM_SUBMISSIONS, variables } });
        }
    };
};
