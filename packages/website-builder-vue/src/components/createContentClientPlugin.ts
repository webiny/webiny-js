import type { App, Plugin } from "vue";
import type { ContentClient } from "@webiny/website-builder-sdk";
import { CONTENT_CLIENT_KEY } from "./ContentClientProvider.js";

/**
 * A Vue plugin that provides `client` to the whole app, for apps that create one app per
 * request (e.g. SSR with `createSSRApp`).
 */
export const createContentClientPlugin = (client: ContentClient): Plugin => {
    return {
        install(app: App) {
            app.provide(CONTENT_CLIENT_KEY, client);
        }
    };
};
