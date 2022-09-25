import { I18NLocaleItem } from "@webiny/app-i18n/types";
import { ApolloClient } from "apollo-client";
import { LIST_LOCALES } from "@webiny/app-i18n/admin/views/locales/hooks/graphql";

interface FetchLocaleParams {
    client: ApolloClient<any>;
}

export const fetchLocales = async (params: FetchLocaleParams): Promise<I18NLocaleItem[]> => {
    const { client } = params;

    const response = await client.query({
        query: LIST_LOCALES
    });
    if (!response.data?.i18n?.listI18NLocales) {
        throw new Error("Missing response when fetching locales.");
    } else if (response.data.i18n.listI18NLocales.error) {
        throw new Error(response.data.i18n.listI18NLocales.error.message);
    }

    return response.data.i18n.listI18NLocales.data || [];
};
