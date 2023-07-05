import jsonpack from "jsonpack";

import { processors } from "~/migrations/5.35.0/006/utils/processors";

import { Page } from "../types";

export interface CompressedValue {
    compression: string;
    content: string | null;
}

const decompress = (page: Pick<Page, "content">): Promise<any> | null => {
    if (!page || !page.content) {
        return null;
    }
    try {
        return jsonpack.unpack(page.content.content);
    } catch (ex) {
        console.log(`Error while decompressing page content: ${ex.message}`);
        return null;
    }
};

export async function getSearchablePageContent(
    page: Pick<Page, "title" | "content">
): Promise<string> {
    const result = [page.title];

    const content = await decompress(page);

    if (content) {
        for (const block of content.elements) {
            await traverse(block, async (element: Record<string, any>) => {
                for (const processor of processors) {
                    const processed = processor(element);
                    result.push(processed);
                }
            });
        }
    }

    return result.filter(Boolean).join(" ").trim();
}

async function traverse(element: Record<string, any>, callback: any) {
    if (element.type !== "block") {
        await callback(element);
    }

    for (const child of element.elements || []) {
        await traverse(child, callback);
    }
}
