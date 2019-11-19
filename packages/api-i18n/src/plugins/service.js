// @flow
import type { PluginType } from "@webiny/api/types";
import i18n from "./i18n";
import { GraphQLClient } from "graphql-request";

let localesCache;

export default ([
    i18n,
    {
        name: "graphql-context-i18n-get-locales",
        type: "graphql-context-i18n-get-locales",
        async resolve({ context }) {
            if (Array.isArray(localesCache)) {
                return localesCache;
            }

            const client = new GraphQLClient(process.env.I18N_API_URL, {
                headers: {
                    Authorization: context.token
                }
            });

            return await client.request();
        }
    }
]: Array<PluginType>);
