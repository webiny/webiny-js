import gql from "graphql-tag";

export const listI18NLocales = gql`
    query ListI18NLocales {
        i18n {
            listI18NLocales {
                data {
                    id
                    code
                    default
                }
            }
        }
    }
`;
