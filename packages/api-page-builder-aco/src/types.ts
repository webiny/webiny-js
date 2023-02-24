import { AcoContext } from "@webiny/api-aco/types";
import { Page, PbPageElement } from "@webiny/api-page-builder/types";
import { PbContext } from "@webiny/api-page-builder/graphql/types";
import { Context as BaseContext } from "@webiny/handler/types";

interface PageSearchProcessorParams {
    page: Page;
    block: PbPageElement;
    element: PbPageElement;
}

export type PbPageRecordData = Pick<
    Page,
    "id" | "title" | "createdOn" | "createdBy" | "savedOn" | "status" | "version" | "locked"
>;

export interface PageSearchProcessor {
    (params: PageSearchProcessorParams): string;
}

export interface PbAcoContext extends BaseContext, AcoContext, PbContext {
    pageBuilderAco: {
        addPageSearchProcessor(processor: PageSearchProcessor): void;
        processPageSearchContent(content: Page): Promise<string>;
    };
}
