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
                throw new Error('I18N_API_URL environment variable is missing. Please check the service configuration, located in the "api/serverless.yml" file.');
            }

            try {
                validation.validateSync(process.env.I18N_API_URL, "url");
            } catch (e) {
                throw new Error('The value specified for the I18N_API_URL env variable is not a valid URL. Please check the service configuration, located in the "api/serverless.yml" file.')
            }

            const client = new GraphQLClient(process.env.I18N_API_URL);

            const response = await client.request(GET_I18N_INFORMATION);
            localesCache = get(response, "i18n.getI18NInformation.locales", []);
            return localesCache;
        }
    } as GraphQLContextI18NGetLocales
];
