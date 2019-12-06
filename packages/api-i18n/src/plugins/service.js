// @flow
import type { PluginType } from "@webiny/api/types";
import i18n from "./i18n";
import { GraphQLClient } from "graphql-request";
import get from "lodash/get";

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

export default () =>
    ([
        i18n,
        {
            name: "graphql-context-i18n-get-locales",
            type: "graphql-context-i18n-get-locales",
            async resolve() {
                if (Array.isArray(localesCache)) {
                    return localesCache;
                }

                const client = new GraphQLClient(process.env.I18N_API_URL);

                const response = await client.request(GET_I18N_INFORMATION);
                localesCache = get(response, "i18n.getI18NInformation.locales", []);
                return localesCache;
            }
        }
    ]: Array<PluginType>);
