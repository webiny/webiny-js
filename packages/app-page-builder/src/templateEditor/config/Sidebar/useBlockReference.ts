import { useActiveElement } from "~/editor/hooks/useActiveElement";
import { PbEditorElement } from "~/types";

export interface BlockReference {
    referencedBlockId: string;
    block: PbEditorElement;
}

export const useBlockReference = (): BlockReference | undefined => {
    const [element] = useActiveElement();
    const referencedBlockId = element && element.data?.blockId;

    if (element?.type !== "block" || !referencedBlockId) {
        return undefined;
    }

    return {
        referencedBlockId,
        block: element
    };
};
