import { createCompression } from "@webiny/api-page-builder/graphql/crud/pages/compression";

import { Page, PbPageElement } from "@webiny/api-page-builder/types";
import { PbAcoContext, PageSearchProcessor } from "~/types";

interface ElementCallback {
    (element: PbPageElement): Promise<void>;
}

export async function getSearchablePageContent(
    context: PbAcoContext,
    page: Page,
    processors: PageSearchProcessor[]
): Promise<string> {
    const result = [page.title];

    const { decompressContent } = createCompression({
        plugins: context.plugins
    });

    const content = await decompressContent(page);

    if (content) {
        for (const block of content.elements) {
            await traverse(block, async element => {
                for (const processor of processors) {
                    const processed = processor({ page, block, element });
                    result.push(processed);
                }
            });
        }
    }

    return result.filter(Boolean).join(" ").trim();
}

async function traverse(element: PbPageElement, callback: ElementCallback) {
    if (element.type !== "block") {
        await callback(element);
    }

    for (const child of element.elements || []) {
        await traverse(child, callback);
    }
}
