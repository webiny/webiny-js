import { createHandler } from "@webiny/handler-aws";
import apolloServerPlugins from "@webiny/handler-graphql";
import i18nPlugins from "../src/graphql";
import securityPlugins from "@webiny/api-security/authenticator";
import dbPlugins from "@webiny/handler-db";
import { DynamoDbDriver } from "@webiny/db-dynamodb";
import { DocumentClient } from "aws-sdk/clients/dynamodb";
import { SecurityIdentity } from "@webiny/api-security";

export default () => {
    // Creates the actual handler. Feel free to add additional plugins if needed.
    const handler = createHandler(
        dbPlugins({
            table: "I18N",
            driver: new DynamoDbDriver({
                documentClient: new DocumentClient({
                    convertEmptyValues: true,
                    endpoint: process.env.MOCK_DYNAMODB_ENDPOINT,
                    sslEnabled: false,
                    region: "local"
                })
            })
        }),
        apolloServerPlugins(),
        securityPlugins(),
        { type: "security-authorization", getPermissions: () => [{ name: "*" }] },
        {
            type: "security-authentication",
            async authenticate(context) {
                if ("Authorization" in context.http.request.headers) {
                    return;
                }

                return new SecurityIdentity({
                    id: "admin@webiny.com",
                    type: "admin",
                    displayName: "John Doe"
                });
            }
        },
        {
            type: "context",
            apply(context) {
                context.security.getTenant = () => {
                    return { id: "root", name: "Root", parent: null };
                };
            }
        },
        i18nPlugins()
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
        handler,
        invoke,
        async createI18NLocale(variables) {
            return invoke({ body: { query: CREATE_LOCALE, variables } });
        },
        async updateI18NLocale(variables) {
            return invoke({ body: { query: UPDATE_LOCALE, variables } });
        },
        async deleteI18NLocale(variables) {
            return invoke({ body: { query: DELETE_LOCALE, variables } });
        },
        async listI18NLocales(variables) {
            return invoke({ body: { query: LIST_LOCALES, variables } });
        },
        async getI18NLocale(variables) {
            return invoke({ body: { query: GET_LOCALE, variables } });
        },
        async getI18NInformation(variables, rest = {}) {
            return invoke({ body: { query: GET_I18N_INFORMATION, variables }, ...rest });
        }
    };
};

const GET_I18N_INFORMATION = /* GraphQL */ `
    {
        i18n {
            getI18NInformation {
                currentLocales {
                    context
                    locale
                }
                locales {
                    default
                    code
                }
                defaultLocale {
                    default
                    code
                }
            }
        }
    }
`;

const BASE_FIELDS = `
    code
    default
    createdOn
    createdBy {
        id
        displayName
        type
    }               
`;

const ERROR_FIELDS = `
    code
    data
    message
`;

const CREATE_LOCALE = /* GraphQL */ `
    mutation CreateI18NLocale($data: I18NLocaleInput!) {
        i18n {
            createI18NLocale(data: $data) {
                data {
                    ${BASE_FIELDS}
                }
                error {
                    ${ERROR_FIELDS}
                }
            }
        }
    }
`;

const UPDATE_LOCALE = /* GraphQL */ `
    mutation UpdateI18NLocale($code: String!, $data: I18NLocaleUpdateInput!) {
        i18n {
            updateI18NLocale(code: $code, data: $data) {
                data {
                    ${BASE_FIELDS}
                }
                error {
                    ${ERROR_FIELDS}
                }
            }
        }
    }
`;

const LIST_LOCALES = /* GraphQL */ `
    query ListI18NLocales {
        i18n {
            listI18NLocales {
                data {
                    ${BASE_FIELDS}
                }
                error {
                    ${ERROR_FIELDS}
                }
            }
        }
    }
`;

const GET_LOCALE = /* GraphQL */ `
    query GetI18NLocale($code: String!) {
        i18n {
            getI18NLocale(code: $code) {
                data {
                    ${BASE_FIELDS}
                }
                error {
                    ${ERROR_FIELDS}
                }
            }
        }
    }
`;

const DELETE_LOCALE = /* GraphQL */ `
    mutation DeleteI18NLocale($code: String!) {
        i18n {
            deleteI18NLocale(code: $code) {
                data {
                    ${BASE_FIELDS}
                }
                error {
                    ${ERROR_FIELDS}
                }
            }
        }
    }
`;
