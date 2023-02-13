import { AcoContext } from "@webiny/api-aco/types";
import { Page, PbPageElement } from "@webiny/api-page-builder/types";
import { PbContext } from "@webiny/api-page-builder/graphql/types";
import { Context as BaseContext } from "@webiny/handler/types";

interface PageElementProcessorParams {
    page: Page;
    block: PbPageElement;
    element: PbPageElement;
}

export type PbPageRecordData = Pick<
    Page,
    "id" | "createdOn" | "createdBy" | "savedOn" | "status" | "version" | "locked"
>;

export interface PageElementProcessor {
    (params: PageElementProcessorParams): Promise<void> | void;
}

export interface PbAcoContext extends BaseContext, AcoContext, PbContext {
    pageBuilderAco: {
        addPageElementProcessor(processor: PageElementProcessor): void;
        processPageContent(content: Page): Promise<Page>;
    };
}
