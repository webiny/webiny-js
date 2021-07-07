export const GET_I18N_INFORMATION = /* GraphQL */ `
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

export const BASE_FIELDS = `
    code
    default
    createdOn
    createdBy {
        id
        displayName
        type
    }
`;

export const ERROR_FIELDS = `
    code
    data
    message
`;

export const CREATE_LOCALE = /* GraphQL */ `
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

export const UPDATE_LOCALE = /* GraphQL */ `
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

export const LIST_LOCALES = /* GraphQL */ `
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

export const GET_LOCALE = /* GraphQL */ `
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

export const DELETE_LOCALE = /* GraphQL */ `
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
