import i18n from "./i18n";
import { GraphQLClient } from "graphql-request";
import get from "lodash/get";
import { GraphQLContextI18NGetLocales } from "@webiny/api-i18n/types";
import { GraphQLContext } from "@webiny/graphql/types";

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
        async resolve({ context }) {
            if (Array.isArray(localesCache)) {
                return localesCache;
            }

            const client = new GraphQLClient(context.event.headers["x-webiny-apollo-gateway-url"]);

            const response = await client.request(GET_I18N_INFORMATION);
            localesCache = get(response, "i18n.getI18NInformation.locales", []);
            return localesCache;
        }
    } as GraphQLContextI18NGetLocales<GraphQLContext>
];
