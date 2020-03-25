import i18n from "./i18n";
import { GraphQLClient } from "graphql-request";
import get from "lodash/get";
import { validation } from "@webiny/validation";
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

type I18NServicePluginsOptions = {
    graphqlUrl: string;
};

export default (options: I18NServicePluginsOptions = { graphqlUrl: "" }) => [
    i18n,
    {
        name: "graphql-context-i18n-get-locales",
        type: "graphql-context-i18n-get-locales",
        async resolve() {
            if (Array.isArray(localesCache)) {
                return localesCache;
            }

            if (!options.graphqlUrl) {
                throw new Error(
                    `Cannot create I18N service plugins - "graphqlUrl" parameter is missing.`
                );
            }

            try {
                validation.validateSync(options.graphqlUrl, "url");
            } catch (e) {
                throw new Error(
                    `Cannot create I18N service plugins - "graphqlUrl" parameter doesn't represent a valid URL.`
                );
            }

            const client = new GraphQLClient(options.graphqlUrl);

            const response = await client.request(GET_I18N_INFORMATION);
            localesCache = get(response, "i18n.getI18NInformation.locales", []);
            return localesCache;
        }
    } as GraphQLContextI18NGetLocales
];
