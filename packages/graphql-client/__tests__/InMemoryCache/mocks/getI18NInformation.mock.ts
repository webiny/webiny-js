import gql from "graphql-tag";

export const GET_I18N_INFORMATION = gql`
    {
        i18n {
            getI18NInformation {
                currentLocales {
                    context
                    locale
                }
                locales {
                    code
                    default
                }
            }
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
                        locale: "en-US"
                    },
                    {
                        context: "content",
                        locale: "en-US"
                    }
                ],
                locales: [{ code: "en-US", default: true }]
            }
        }
    }
};
