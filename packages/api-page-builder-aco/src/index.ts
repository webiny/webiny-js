import { ContextPlugin } from "@webiny/api";

import { createPageHooks } from "~/page/hooks";
import { createPageProcessors } from "~/page/processors";
import { getSearchablePageContent } from "~/utils/getSearchableContent";

import { PageSearchProcessor, PbAcoContext } from "~/types";

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
