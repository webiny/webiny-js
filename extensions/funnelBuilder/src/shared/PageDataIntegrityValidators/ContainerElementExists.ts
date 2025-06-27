import { ElementTreeTraverser } from "../ElementTreeTraverser";
import { PbPage, PbPageElement } from "../types";
import { isContainerElementType } from "../constants";
import { FunnelModelDto } from "../models/FunnelModel";

export class ContainerElementExists {
    static id = "ContainerElementExists";

    // Ensures the existence of the container element in a page.
    static validate(page: PbPage) {
        const traverser = new ElementTreeTraverser();

        let containerElement: PbPageElement<FunnelModelDto> | null = null;
        traverser.traverse(page.content, element => {
            if (isContainerElementType(element.type)) {
                containerElement = element as PbPageElement<FunnelModelDto>;
                return false;
            }
            return;
        });

        if (!containerElement) {
            throw new Error("Container element not found.");
        }
    }
}
