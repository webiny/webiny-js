import gql from "graphql-tag";
import { I18NLocaleItem } from "~/types";

const BASE_FIELDS = `
    code
    default
    createdOn
`;

interface I18NLocaleResponseError {
    message: string;
    code: string;
    data: Record<string, any>;
}

interface ListI18NLocalesResponseMeta {
    hasMoreItems: boolean;
    totalCount: number;
    cursor: string | null;
}

export interface ListI18NLocalesResponse {
    i18n: {
        listI18NLocales: {
            data: I18NLocaleItem[];
            meta: ListI18NLocalesResponseMeta;
            error?: I18NLocaleResponseError;
        };
    };
}

export const LIST_LOCALES = gql`
    query listI18NLocales {
        i18n {
            listI18NLocales(limit: 1000) {
                data {
                    ${BASE_FIELDS}
                }
                meta {
                    totalCount
                    hasMoreItems
                    cursor
                }
                error {
                    code
                    message
                    data
                }
            }
        }
    }
`;

export const GET_LOCALE = gql`
    query getI18NLocale($code: String!) {
        i18n {
            getI18NLocale(code: $code){
                data {
                    ${BASE_FIELDS}
                }
                error {
                    code
                    message
                }
            }
        }
    }
`;

export const CREATE_LOCALE = gql`
    mutation createI18NLocale($data: I18NLocaleInput!){
        i18n {
            locale: createI18NLocale(data: $data) {
                data {
                    ${BASE_FIELDS}
                }
                error {
                    code
                    message
                    data
                }
            }
        }
    }
`;

export const UPDATE_LOCALE = gql`
    mutation updateI18NLocale($code: String!, $data: I18NLocaleUpdateInput!){
        i18n {
            locale: updateI18NLocale(code: $code, data: $data) {
                data {
                    ${BASE_FIELDS}
                }
                error {
                    code
                    message
                    data
                }
            }
        }
    }
`;

export const DELETE_LOCALE = gql`
    mutation deleteI18NLocale($code: String!) {
        i18n {
            deleteI18NLocale(code: $code) {
                error {
                    code
                    message
                }
            }
        }
    }
`;
