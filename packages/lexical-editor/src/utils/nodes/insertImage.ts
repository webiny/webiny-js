import { $insertNodes, $isRootOrShadowRoot } from "lexical";
import { $createParagraphNode } from "~/nodes/ParagraphNode";
import { $createImageNode } from "~/nodes/ImageNode";
import { $wrapNodeInElement } from "@lexical/utils";
import { InsertImagePayload } from "~/plugins/ImagesPlugin/ImagesPlugin";

/*
 * Insert image into editor.
 */
export const insertImage = (payload: InsertImagePayload): boolean => {
    const imageNode = $createImageNode(payload);
    $insertNodes([imageNode]);
    if ($isRootOrShadowRoot(imageNode.getParentOrThrow())) {
        $wrapNodeInElement(imageNode, $createParagraphNode).selectEnd();
    }
    return true;
};
