import menus from "./crud/menus.crud";
import categories from "./crud/categories.crud";
import pages from "./crud/pages.crud";
import pageValidation from "./crud/pages.validation";
import pageElements from "./crud/pageElements.crud";
import settings from "./crud/settings.crud";
import system from "./crud/system.crud";
import { ContextPlugin } from "@webiny/handler/plugins/ContextPlugin";
import { PbContext } from "~/graphql/types";
import WebinyError from "@webiny/error";
import { JsonpackContentCompressionPlugin } from "~/plugins/JsonpackContentCompressionPlugin";
import { createTopic } from "@webiny/pubsub";

// This setup (using the `createPageBuilder` factory function) is just a starting point.
// The rest of the Page Builder application should be rewritten and use the same approach as well.
// Ultimately, this `createPageBuilder` factory function should be located in package root.
// So, for example: `packages/api-page-builder/src/createPageBuilder.ts`.
const createPageBuilder = () => {
    let prerenderingHandlers = {
        render: async () => {
            console.log('Skipping page rendering - "render" handler not defined.');
        },
        flush: async () => {
            console.log('Skipping page flushing - "flush" handler not defined.');
        }
    };

    return {
        onPageBeforeRender: createTopic("pageBuilder.onBeforeRenderPage"),
        onPageAfterRender: createTopic("pageBuilder.onAfterRenderPage"),
        onPageBeforeFlush: createTopic("pageBuilder.onBeforeFlushPage"),
        onPageAfterFlush: createTopic("pageBuilder.onAfterFlushPage"),
        setPrerenderingHandlers: handlers => {
            prerenderingHandlers = handlers;
        },
        getPrerenderingHandlers: () => prerenderingHandlers
    };
};

const setup = () => {
    return new ContextPlugin<PbContext>(context => {
        if (context.pageBuilder) {
            throw new WebinyError("PbContext setup must be first loaded.", "CONTEXT_SETUP_ERROR");
        }

        context.pageBuilder = {
            ...context.pageBuilder,
            ...createPageBuilder()
        };
    });
};

export default [
    setup(),
    /**
     * We must have default compression in the page builder.
     * Maybe figure out some other way of registering the plugins.
     */
    new JsonpackContentCompressionPlugin(),
    menus,
    categories,
    pages,
    pageValidation,
    pageElements,
    settings,
    system
];
