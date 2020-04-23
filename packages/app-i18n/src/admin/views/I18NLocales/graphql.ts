import gql from "graphql-tag";

const BASE_FIELDS = `
    id
    code
    default
    createdOn
`;

export const LIST_LOCALES = gql`
    query listI18NLocales(
        $where: JSON
        $sort: JSON
        $search: I18NLocaleSearchInput
        $limit: Int
        $after: String
        $before: String
    ) {
        i18n {
            i18NLocales: listI18NLocales(
                where: $where
                sort: $sort
                search: $search
                limit: $limit
                after: $after
                before: $before
            ) {
                data {
                    ${BASE_FIELDS}
                }
                meta {
                    cursors {
                        next
                        previous
                    }
                    hasNextPage
                    hasPreviousPage
                    totalCount
                }
            }
        }
    }
`;

export const READ_LOCALE = gql`
    query getLocale($id: ID!) {
        i18n {
            locale: getI18NLocale(id: $id){
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
    mutation updateI18NLocale($id: ID!, $data: I18NLocaleInput!){
        i18n {
            locale: updateI18NLocale(id: $id, data: $data) {
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
    mutation deleteI18NLocale($id: ID!) {
        i18n {
            deleteI18NLocale(id: $id) {
                data
                error {
                    code
                    message
                }
            }
        }
    }
`;

export const SEARCH_LOCALE_CODES = gql`
    query searchLocaleCodes($search: String!) {
        i18n {
            codes: searchLocaleCodes(search: $search) {
                data
            }
        }
    }
`;
