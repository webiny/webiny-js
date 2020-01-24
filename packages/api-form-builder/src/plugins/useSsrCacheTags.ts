import { withHooks } from "@webiny/commodo";
import SsrApiClient from "@webiny/http-handler-ssr/Client";
import { GraphQLContextPlugin } from "@webiny/api/types";

export default (): GraphQLContextPlugin[] => [
    {
        type: "graphql-context",
        name: "graphql-context-ssr-cache-client",
        async apply(context) {
            if (!context.models || !context.models.FormSettings) {
                throw new Error(
                    `Cannot apply "useSsrCacheTags" set of plugins, make sure they are registered after the base "api-form-builder" plugins.`
                );
            }

            const settings = await context.models.FormSettings.load();
            // TODO: @pavel figure out how to add property to type declaration
            context.ssrApiClient = new SsrApiClient({ url: settings.data.domain });
        }
    },
    {
        // After settings were changed, invalidate all pages that contain pb-settings tag.
        type: "graphql-context",
        name: "graphql-context-extend-fb-form-invalidate-ssr-cache",
        apply({ ssrApiClient, models: { Form } }) {
            withHooks({
                async afterPublish() {
                    await ssrApiClient.invalidateSsrCacheByTags({
                        tags: [{ class: "fb-form", id: this.parent }]
                    });
                },
                async afterUnpublish() {
                    await ssrApiClient.invalidateSsrCacheByTags({
                        tags: [{ class: "fb-form", id: this.parent }]
                    });
                }
            })(Form);
        }
    }
];
