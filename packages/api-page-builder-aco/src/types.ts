import { ACOContext } from "@webiny/api-aco/types";
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
    | "id"
    | "pid"
    | "title"
    | "createdOn"
    | "createdBy"
    | "savedOn"
    | "status"
    | "version"
    | "locked"
    | "path"
>;

export interface PageSearchProcessor {
    (params: PageSearchProcessorParams): string;
}

export interface PbAcoContext extends BaseContext, ACOContext, PbContext {
    pageBuilderAco: {
        addPageSearchProcessor(processor: PageSearchProcessor): void;
        getSearchablePageContent(content: Page): Promise<string>;
    };
}
