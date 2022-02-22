import ApolloClient from "apollo-client";
import { ApolloLink } from "apollo-link";
import { ApolloDynamicLink } from "@webiny/app/plugins/ApolloDynamicLink";
import { InMemoryCache } from "@webiny/app/apollo-client/InMemoryCache";
import { plugins } from "@webiny/plugins";
import { ApolloCacheObjectIdPlugin } from "@webiny/app/plugins/ApolloCacheObjectIdPlugin";
import { BatchHttpLink } from "apollo-link-batch-http";

export interface CreateCmsApolloClientParams {
    locale: string;
    apiUrl: string;
    endpoint: "manage" | "read";
}
export const createCmsApolloClient = ({ locale, apiUrl, endpoint }: CreateCmsApolloClientParams) => {
    return new ApolloClient({
        link: ApolloLink.from([
            /**
             * This will process links from plugins on every request.
             */
            new ApolloDynamicLink(),
            /**
             * This batches requests made to the API to pack multiple requests into a single HTTP request.
             */
            new BatchHttpLink({
                uri: `${apiUrl}/cms/${endpoint}/${locale}`
            })
        ]),
        cache: new InMemoryCache({
            addTypename: true,
            dataIdFromObject: obj => {
                /**
                 * Since every data type coming from API can have a different data structure,
                 * we cannot rely on having an `id` field.
                 */
                const getters = plugins.byType<ApolloCacheObjectIdPlugin>(
                    ApolloCacheObjectIdPlugin.type
                );

                for (let i = 0; i < getters.length; i++) {
                    const id = getters[i].getObjectId(obj);
                    if (typeof id !== "undefined") {
                        return id;
                    }
                }

                /**
                 * As a fallback, try getting object's `id`.
                 */
                return obj.id || null;
            }
        })
    });
};
