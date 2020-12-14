import gql from "graphql-tag";

export const GET_I18N_INFORMATION = gql`
    query GetI18NInformation {
        i18n {
            getI18NInformation {
                currentLocales {
                    context
                    locale
                    __typename
                }
                locales {
                    code
                    default
                    __typename
                }
                __typename
            }
            __typename
        }
    }
`;

export default {
    query: GET_I18N_INFORMATION,
    result: {
        i18n: {
            getI18NInformation: {
                currentLocales: [
                    {
                        context: "default",
                        locale: "en-US",
                        __typename: "I18NInformationCurrentLocale"
                    },
                    {
                        context: "content",
                        locale: "en-US",
                        __typename: "I18NInformationCurrentLocale"
                    }
                ],
                locales: [{ code: "en-US", default: true, __typename: "I18NInformationLocale" }],
                __typename: "I18NInformationResponse"
            },
            __typename: "I18NQuery"
        }
    }
};
