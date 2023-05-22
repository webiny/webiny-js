import { ContextPlugin } from "@webiny/api";
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
        }
    };
};

export const createAcoPageBuilderContext = () => {
    return new ContextPlugin<PbAcoContext>(async context => {
        await setupContext(context);
        createPageHooks(context);
        createPageProcessors(context);
    });
};

export const createAcoPageBuilderImportExportContext = () => {
    return new ContextPlugin<PbAcoContext>(async context => {
        await setupContext(context);
        createImportExportPageHooks(context);
        createPageProcessors(context);
    });
};
