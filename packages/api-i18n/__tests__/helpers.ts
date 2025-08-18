import {
    CREATE_LOCALE,
    DELETE_LOCALE,
    GET_I18N_INFORMATION,
    GET_LOCALE,
    LIST_LOCALES,
    UPDATE_LOCALE
} from "./graphql/locales";
import { GET_VERSION, INSTALL } from "./graphql/system";
import type { GenericRecord } from "@webiny/api/types.js";

export interface IApiCallsFactoryInvokeParams {
    httpMethod?: string;
    body: {
        query: string;
        variables?: GenericRecord | null;
    };
    headers?: Record<string, string>;
}
export interface IApiCallsFactoryInvoke {
    (params: IApiCallsFactoryInvokeParams): Promise<[unknown, unknown]>;
}

export const apiCallsFactory = (invoke: IApiCallsFactoryInvoke) => {
    return {
        async createI18NLocale(variables: GenericRecord, fields: string[] = []) {
            return invoke({ body: { query: CREATE_LOCALE(fields), variables } });
        },
        async updateI18NLocale(variables: GenericRecord, fields: string[] = []) {
            return invoke({ body: { query: UPDATE_LOCALE(fields), variables } });
        },
        async deleteI18NLocale(variables: GenericRecord) {
            return invoke({ body: { query: DELETE_LOCALE, variables } });
        },
        async listI18NLocales(variables: GenericRecord = {}) {
            return invoke({ body: { query: LIST_LOCALES, variables } });
        },
        async getI18NLocale(variables: GenericRecord) {
            return invoke({ body: { query: GET_LOCALE, variables } });
        },
        async getI18NInformation(variables: GenericRecord | null = {}, rest = {}) {
            return invoke({ body: { query: GET_I18N_INFORMATION, variables }, ...rest });
        },
        async install(variables: GenericRecord) {
            return invoke({ body: { query: INSTALL, variables } });
        },
        async getVersion() {
            return invoke({ body: { query: GET_VERSION } });
        }
    };
};
