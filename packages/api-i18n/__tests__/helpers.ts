import {
    CREATE_LOCALE,
    DELETE_LOCALE,
    GET_I18N_INFORMATION,
    GET_LOCALE,
    LIST_LOCALES,
    UPDATE_LOCALE
} from "./graphql/locales";
import { GET_VERSION, INSTALL } from "./graphql/system";

export const apiCallsFactory = invoke => {
    return {
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
