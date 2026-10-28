import { defineComponent, provide, inject, type InjectionKey, type PropType } from "vue";
import type { ContentClient } from "@webiny/website-builder-sdk";
import { contentSdk } from "@webiny/website-builder-sdk";

export const CONTENT_CLIENT_KEY: InjectionKey<ContentClient> = Symbol("WebinyContentClient");

/**
 * Renders the documents below it with `client`: its component registry, content entry cache,
 * document stores and data. Without this provider (or `createContentClientPlugin`), renderers
 * use the `contentSdk` singleton.
 *
 * Equivalent of the React ContentClientProvider.
 */
export const ContentClientProvider = defineComponent({
    name: "WebinyContentClientProvider",

    props: {
        client: { type: Object as PropType<ContentClient>, required: true }
    },

    setup(props, { slots }) {
        provide(CONTENT_CLIENT_KEY, props.client);

        return () => slots.default?.();
    }
});

/**
 * Composable – the client from the nearest ContentClientProvider or app plugin, or the
 * `contentSdk` singleton when there is none. Must be called inside setup().
 */
export const useContentClient = (): ContentClient => {
    const client = inject(CONTENT_CLIENT_KEY, undefined);
    return client ?? contentSdk;
};
