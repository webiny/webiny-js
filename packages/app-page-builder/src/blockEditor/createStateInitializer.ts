import omit from "lodash/omit";
import {
    blockAtom,
    BlockAtomType,
    BlockWithContent,
    blockCategoriesAtom,
    BlockCategoriesAtomType
} from "~/blockEditor/state";
import { EditorStateInitializerFactory } from "~/editor/Editor";

export const createStateInitializer = (
    block: BlockWithContent,
    blockCategories: BlockCategoriesAtomType
): EditorStateInitializerFactory => {
    return () => ({
        content: block.content,
        recoilInitializer({ set }) {
            /**
             * We always unset the content because we are not using it via the block atom.
             */
            const blockData: BlockAtomType = omit(block, ["content"]);
            set(blockAtom, blockData);
            set(blockCategoriesAtom, blockCategories);
        }
    });
};
