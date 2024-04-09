import { Page, PageElementProcessor, PbPageElement } from "~/types";

export async function processPageContent(page: Page, processors: PageElementProcessor[]) {
    const processedContent = structuredClone(page.content) as PbPageElement;

    // Children of the root element of content contain elements of type "block".
    for (const block of processedContent.elements) {
        await traverse(block, async element => {
            for (const processor of processors) {
                await processor({ page, block, element });
            }
        });
    }

    return { ...page, content: processedContent };
}

interface ElementCallback {
    (element: PbPageElement): Promise<void>;
}

async function traverse(element: PbPageElement, callback: ElementCallback) {
    if (element.type !== "block") {
        await callback(element);
    }

    for (const child of element.elements || []) {
        await traverse(child, callback);
    }
}
