import i18n from "./i18n";
import { GraphQLClient } from "graphql-request";
import get from "lodash/get";
import { validation, ValidationError } from '@webiny/validation';
import { GraphQLContextI18NGetLocales } from "@webiny/api-i18n/types";

let localesCache;

const GET_I18N_INFORMATION = /* GraphQL */ `
    {
        i18n {
            getI18NInformation {
                locales {
                    id
                    code
                    default
                }
            }
        }
    }
`;

export default () => [
    i18n,
    {
        name: "graphql-context-i18n-get-locales",
        type: "graphql-context-i18n-get-locales",
        async resolve() {
            if (Array.isArray(localesCache)) {
                return localesCache;
            }

            if (!process.env.I18N_API_URL) {
                throw new Error(
                    `I18N_API_URL env variable is missing. Make sure it's specified in the service 'serverless.yml' configuration.`
                );
            }

            if (validation.validate(process.env.I18N_API_URL, 'url', { throw: false }) instanceof ValidationError) {
                throw new Error(
                    `Invalid URL specified for I18N_API_URL env variable.`
                )
            }

            const client = new GraphQLClient(process.env.I18N_API_URL);

            const response = await client.request(GET_I18N_INFORMATION);
            localesCache = get(response, "i18n.getI18NInformation.locales", []);
            return localesCache;
        }
    } as GraphQLContextI18NGetLocales
];
