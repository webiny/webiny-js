import { createAbstraction } from "@webiny/feature/admin";
import type { DocumentBindings, ElementMap } from "@webiny/website-builder-sdk";

// A page that can be picked to preview a layout with.
export interface LayoutPreviewPageOption {
    id: string;
    title: string;
    path: string;
}

// A page as it's delivered (with its global components), rendered inside the layout open in the editor.
export interface LayoutPreviewPage {
    id: string;
    properties: Record<string, any>;
    elements: ElementMap;
    bindings: DocumentBindings;
}

// Gateway

export interface ILayoutPreviewPagesGateway {
    // A page as it's delivered (not raw): with its global components and overrides merged.
    getPage(id: string): Promise<LayoutPreviewPage>;
}

export const LayoutPreviewPagesGateway = createAbstraction<ILayoutPreviewPagesGateway>(
    "WebsiteBuilder/LayoutPreviewPagesGateway"
);

export namespace LayoutPreviewPagesGateway {
    export type Interface = ILayoutPreviewPagesGateway;
}

// Use cases

export interface IListLayoutPreviewPagesUseCase {
    // The most recently saved pages, or the pages matching `search` (their title, path, ...).
    execute(search?: string): Promise<LayoutPreviewPageOption[]>;
}

export const ListLayoutPreviewPagesUseCase = createAbstraction<IListLayoutPreviewPagesUseCase>(
    "WebsiteBuilder/ListLayoutPreviewPagesUseCase"
);

export namespace ListLayoutPreviewPagesUseCase {
    export type Interface = IListLayoutPreviewPagesUseCase;
}

export interface IGetLayoutPreviewPageUseCase {
    execute(pageId: string): Promise<LayoutPreviewPage>;
}

export const GetLayoutPreviewPageUseCase = createAbstraction<IGetLayoutPreviewPageUseCase>(
    "WebsiteBuilder/GetLayoutPreviewPageUseCase"
);

export namespace GetLayoutPreviewPageUseCase {
    export type Interface = IGetLayoutPreviewPageUseCase;
}
