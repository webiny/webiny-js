import { RecoilRootProps } from "recoil";
import { elementsAtom, rootElementAtom } from "~/editor/recoil/modules";
import { flattenElements } from "~/editor/helpers";
import omit from "lodash/omit";
import { blockAtom, BlockAtomType, BlockWithContent } from "~/blockEditor/state";

export const createStateInitializer = (
    block: BlockWithContent
): RecoilRootProps["initializeState"] => {
    return ({ set }) => {
        /* Here we initialize elementsAtom and rootElement if it exists */
        set(rootElementAtom, block.content?.id || "");

        const elements = flattenElements(block.content);
        Object.keys(elements).forEach(key => {
            set(elementsAtom(key), elements[key]);
        });
        /**
         * We always unset the content because we are not using it via the block atom.
         */
        const blockData: BlockAtomType = omit(block, ["content"]);

        set(blockAtom, blockData);
    };
};
