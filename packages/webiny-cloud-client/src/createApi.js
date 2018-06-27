// @flow
import ApolloClient from "apollo-client";
import { createUploadLink } from "apollo-upload-client";
import { ApolloLink } from "apollo-link";
import { setContext } from "apollo-link-context";
import { InMemoryCache } from "apollo-cache-inmemory";
import fetch from "node-fetch";

export default function createApi(options: Object) {
    const { token, uri, ...config } = options;

    if (!config.cache) {
        config.cache = new InMemoryCache();
    }

    config.link = ApolloLink.from([
        setContext((req, context) => {
            return {
                ...context,
                headers: {
                    Authorization: "Bearer " + token
                }
            };
        }),
        createUploadLink({ uri, fetch })
    ]);

    return new ApolloClient(config);
}
