// @flow
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
        $page: Int
        $perPage: Int
        $search: I18NLocaleSearchInput
    ) {
        i18n {
            i18NLocales: listI18NLocales(
                where: $where
                sort: $sort
                page: $page
                perPage: $perPage
                search: $search
            ) {
                data {
                    ${BASE_FIELDS}
                }
                meta {
                    totalCount
                    to
                    from
                    nextPage
                    previousPage
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

export const searchLocaleCodes = gql`
    query searchLocaleCodes($search: String!) {
        i18n {
            codes: searchLocaleCodes(search: $search) {
                data
            }
        }
    }
`;
