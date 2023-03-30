import { ContextPlugin } from "@webiny/api";

import { createImportExportPageHooks, createPageHooks } from "~/file/hooks";

import { getSearchablePageContent } from "~/utils/getSearchableContent";

import { PbAcoContext } from "~/types";

const setupContext = (context: PbAcoContext) => {
    const pageSearchProcessors: PageSearchProcessor[] = [];

    context.pageBuilderAco = {
        addPageSearchProcessor(processor) {
            pageSearchProcessors.push(processor);
        },
        async getSearchablePageContent(page) {
            return getSearchablePageContent(context, page, pageSearchProcessors);
        }
    };
};

export const createAcoPageBuilderContext = () => {
    return new ContextPlugin<PbAcoContext>(context => {
        setupContext(context);
        createPageHooks(context);
        createPageProcessors(context);
    });
};

export const createAcoPageBuilderImportExportContext = () => {
    return new ContextPlugin<PbAcoContext>(context => {
        setupContext(context);
        createImportExportPageHooks(context);
        createPageProcessors(context);
    });
};
