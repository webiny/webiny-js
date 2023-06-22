import { ContextPlugin } from "@webiny/api";
import { getAncestorFoldersByPage } from "~/page/getFolderAncestorsByPage";
import { createImportExportPageHooks, createPageHooks } from "~/page/hooks";
import { createPageProcessors } from "~/page/processors";
import { getSearchablePageContent } from "~/utils/getSearchableContent";
import { PageSearchProcessor, PbAcoContext } from "~/types";
import { createApp } from "~/app";

export * from "./createAppModifier";
export * from "./plugins";

const setupContext = async (context: PbAcoContext): Promise<void> => {
    const pageSearchProcessors: PageSearchProcessor[] = [];

    const app = await context.aco.registerApp(createApp());

    context.pageBuilderAco = {
        app,
        addPageSearchProcessor(processor) {
            pageSearchProcessors.push(processor);
        },
        async getSearchablePageContent(page) {
            return getSearchablePageContent(context, page, pageSearchProcessors);
        },
        async getAncestorFoldersByPage(page) {
            return getAncestorFoldersByPage(context, page);
        }
    };
};

export const createAcoPageBuilderContext = () => {
    const plugin = new ContextPlugin<PbAcoContext>(async context => {
        if (!context.aco) {
            console.log(
                `There is no ACO initialized so we will not initialize the Page Builder ACO.`
            );
            return;
        }
        await setupContext(context);
        createPageHooks(context);
        createPageProcessors(context);
    });

    plugin.name = "page-builder-aco.createContext";

    return plugin;
};

export const createAcoPageBuilderImportExportContext = () => {
    const plugin = new ContextPlugin<PbAcoContext>(async context => {
        if (!context.aco) {
            console.log(
                `There is no ACO initialized so we will not initialize the Page Builder ACO.`
            );
            return;
        }
        await setupContext(context);
        createImportExportPageHooks(context);
        createPageProcessors(context);
    });

    plugin.name = `page-builder-aco.createImportExportContext`;

    return plugin;
};
