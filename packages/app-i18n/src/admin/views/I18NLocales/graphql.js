// @flow
import gql from "graphql-tag";

const BASE_FIELDS = `
    id
    code
    default
    createdOn
`;

export const loadI18NLocales = gql`
    query LoadI18NLocales(
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

export const loadLocale = gql`
    query LoadLocale($id: ID!) {
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

export const createI18NLocale = gql`
    mutation CreateI18NLocale($data: I18NLocaleInput!){
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

export const updateI18NLocale = gql`
    mutation UpdateI18NLocale($id: ID!, $data: I18NLocaleInput!){
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

export const deleteI18NLocale = gql`
    mutation DeleteI18NLocale($id: ID!) {
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
    query SearchLocaleCodes($search: String!) {
        i18n {
            codes: searchLocaleCodes(search: $search) {
                data
            }
        }
    }
`;
