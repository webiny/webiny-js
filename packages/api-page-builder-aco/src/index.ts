import { ContextPlugin } from "@webiny/api";

import { createPageHooks } from "~/page/hooks";
import { createPageProcessors } from "~/page/processors";
import { processPageSearchContent } from "~/utils/createSearchContent";

import { PageSearchProcessor, PbAcoContext } from "~/types";

const setupContext = () =>
    new ContextPlugin<PbAcoContext>(async context => {
        const pageSearchProcessors: PageSearchProcessor[] = [];

        context.pageBuilderAco = {
            addPageSearchProcessor(processor) {
                pageSearchProcessors.push(processor);
            },
            async processPageSearchContent(page) {
                return processPageSearchContent(context, page, pageSearchProcessors);
            }
        };
    });

const createContext = () => {
    return new ContextPlugin<PbAcoContext>(async context => {
        await setupContext().apply(context);
    });
};

export const pageBuilderAcoPlugins = () => {
    return [createContext(), createPageHooks(), createPageProcessors()];
};
