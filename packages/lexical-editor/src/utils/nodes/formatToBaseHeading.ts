import {
    $getSelection,
    $isRangeSelection,
    DEPRECATED_$isGridSelection,
    LexicalEditor
} from "lexical";
import { $setBlocksType } from "@lexical/selection";
import { $createBaseHeadingNode } from "~/nodes/BaseHeadingNode";
import { HeadingTagType } from "@lexical/rich-text";

/*
 * Will change the selected HTML tag to specified heading or h1-h6.
 * For example if the selection is p with content inside after formatting the root tag
 * will be h1 with heading 1 theme style and the same content inside.
 * */
export const formatToBaseHeading = (
    editor: LexicalEditor,
    tag: HeadingTagType,
    typographyStyleId?: string
) => {
    editor.update(() => {
        const selection = $getSelection();
        if ($isRangeSelection(selection) || DEPRECATED_$isGridSelection(selection)) {
            $setBlocksType(selection, () => $createBaseHeadingNode(tag, typographyStyleId));
        }
    });
};
