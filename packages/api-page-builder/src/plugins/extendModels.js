import { withHooks } from "@webiny/commodo";
import { GraphQLClient } from "graphql-request";
import get from "lodash.get";

const GENERATE_SSR_CACHE_GQL = /* GraphQL */ `
    mutation generateSsrCache($path: String!) {
        ssrCache {
            generateSsrCache(path: $path) {
                error {
                    message
                }
            }
        }
    }
`;

const INVALIDATE_SSR_CACHE_GQL = /* GraphQL */ `
    mutation invalidateSsrCache($tags: [TagsInput]) {
        ssrCache {
            invalidateSsrCache(tags: $tags) {
                error {
                    message
                }
            }
        }
    }
`;

const SSR_CACHE_API_URL = process.env.SSR_CACHE_API_URL;
const checkSsrCacheApiUrl = () => {
    if (!SSR_CACHE_API_URL) {
        throw Error(
            `Cannot regenerate SSR cache - environment variable "SSR_CACHE_API_URL" is missing.`
        );
    }
};

export default [
    {
        type: "extend-models",
        name: "extend-models-pb-page-after-publish",
        extend({ PbPage }) {
            withHooks({
                async afterPublish() {
                    try {
                        checkSsrCacheApiUrl();
                        const client = new GraphQLClient(SSR_CACHE_API_URL);
                        const response = await client.request(GENERATE_SSR_CACHE_GQL, {
                            path: this.url,
                            async: true
                        });
                        const error = get(response, "ssrCache.generateSsrCache.error");
                        if (error) {
                            throw Error(
                                `Cannot regenerate SSR cache - GENERATE_SSR_CACHE_GQL failed, with code "${error.code}" and message "${error.message}".`
                            );
                        }
                    } catch (e) {
                        // eslint-disable-next-line
                        console.warn(
                            `An error occurred while attempting to generate SSR Cache in the "extend-models-pb-page-after-publish" plugin: ${e.message}.`
                        );
                    }
                }
            })(PbPage);
        }
    },
    // ----------------- separate package
    {
        type: "extend-models",
        name: "extend-models-pb-menu-delete-cache-on-change",
        extend({ PbMenu }) {
            // If the menu has changed, we need to delete page caches.
            withHooks({
                async beforeSave() {
                    // If menus structure has changed, we need to invalidate SSR caches that contain this menu.
                    if (!this.getField("items").isDirty()) {
                        return;
                    }

                    this.registerHookCallback("afterSave", async () => {
                        // TODO: set once
                        try {
                            checkSsrCacheApiUrl();
                            const client = new GraphQLClient(SSR_CACHE_API_URL);
                            const response = await client.request(INVALIDATE_SSR_CACHE_GQL, {
                                tags: [{ class: "pb-menu", id: this.slug }],
                                async: true
                            });

                            const error = get(response, "ssrCache.invalidateSsrCache.error");
                            if (error) {
                                throw Error(
                                    `Cannot invalidate ssr cache - INVALIDATE_SSR_CACHE_GQL failed, with code "${error.code}" and message "${error.message}".`
                                );
                            }
                        } catch (e) {
                            // eslint-disable-next-line
                            console.warn(
                                `An error occurred while attempting to invalidate ssr Cache in the "extend-models-pb-menu-delete-cache-on-change" plugin: ${e.message}.`
                            );
                        }
                    });
                }
            })(PbMenu);
        }
    }
];
