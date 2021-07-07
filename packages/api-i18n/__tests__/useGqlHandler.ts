import { createHandler } from "@webiny/handler-aws";
import graphqlHandler from "@webiny/handler-graphql";
import i18nPlugins from "../src/graphql";
import tenancyPlugins from "@webiny/api-tenancy";
import securityPlugins from "@webiny/api-security";
import { SecurityIdentity } from "@webiny/api-security";
import {
    CREATE_LOCALE,
    DELETE_LOCALE,
    GET_I18N_INFORMATION,
    GET_LOCALE,
    LIST_LOCALES,
    UPDATE_LOCALE
} from "./graphql/locales";
import { GET_VERSION, INSTALL } from "./graphql/system";

export default () => {
    // @ts-ignore
    if (typeof __getStorageOperationsPlugins !== "function") {
        throw new Error(`There is no global "__getStorageOperationsPlugins" function.`);
    }
    // @ts-ignore
    const storageOperations = __getStorageOperationsPlugins();
    if (typeof storageOperations !== "function") {
        throw new Error(
            `A product of "__getStorageOperationsPlugins" must be a function to initialize storage operations.`
        );
    }
    // Creates the actual handler. Feel free to add additional plugins if needed.
    const handler = createHandler(
        storageOperations(),
        tenancyPlugins(),
        graphqlHandler(),
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
                context.tenancy.getCurrentTenant = () => {
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
        async listI18NLocales(variables = {}) {
            return invoke({ body: { query: LIST_LOCALES, variables } });
        },
        async getI18NLocale(variables) {
            return invoke({ body: { query: GET_LOCALE, variables } });
        },
        async getI18NInformation(variables = {}, rest = {}) {
            return invoke({ body: { query: GET_I18N_INFORMATION, variables }, ...rest });
        },
        async install(variables) {
            return invoke({ body: { query: INSTALL, variables } });
        },
        async getVersion() {
            return invoke({ body: { query: GET_VERSION } });
        }
    };
};
