import { PbEditorElement } from "~/types";
import { getNanoid } from "~/editor/helpers";

export interface IdGenerator {
    (element: PbEditorElement): string;
}

export const randomIdGenerator: IdGenerator = () => getNanoid();

const createBlockElementIdGenerator = (currentBlockId: string, newBlockId: string): IdGenerator => {
    return element => {
        const parts = element.id.split(".");

        return [newBlockId, ...parts.filter(part => part !== currentBlockId)].join(".");
    };
};

export const getIdGenerator = (element: PbEditorElement) => {
    const referencedBlock = Boolean(element.data.blockId);

    // If it's a referenced block, we construct the child elements IDs using existing IDs, and prefix them with the top-level
    // element ID. This way we have a unique top-level ID, but stable child element IDs (which will be resolved on the API on next load).
    return referencedBlock
        ? createBlockElementIdGenerator(element.id, randomIdGenerator(element))
        : randomIdGenerator;
};
