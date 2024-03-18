import { generateAlphaNumericId } from "@webiny/utils";
import { PageContentElement } from "@webiny/api-page-builder/types";
import { ExportedBlockData } from "~/export/utils";

export class ElementIdsProcessor {
    process(block: ExportedBlockData["block"]): ExportedBlockData["block"] {
        return {
            ...block,
            content: this.ensureElementId(block.content)
        };
    }

    private ensureElementId(element: PageContentElement): PageContentElement {
        const id = element.id || element.data.variableId || generateAlphaNumericId(10);

        return {
            ...element,
            id,
            elements: element.elements.map(element => this.ensureElementId(element))
        };
    }
}
