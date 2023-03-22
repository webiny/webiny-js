import { BlockSelectionTextFormat, TextBlockSelection } from "~/types";
import { $isRangeSelection, $isRootOrShadowRoot, LexicalEditor, RangeSelection } from "lexical";
import { $findMatchingParent } from "@lexical/utils";
import { getSelectedNode } from "~/utils/getSelectedNode";

export const getTextFormatFromSelection = (selection: RangeSelection): BlockSelectionTextFormat => {
    return !$isRangeSelection(selection)
        ? {
              italic: false,
              bold: false,
              underline: false,
              code: false
          }
        : {
              bold: selection.hasFormat("bold"),
              italic: selection.hasFormat("italic"),
              underline: selection.hasFormat("underline"),
              code: selection.hasFormat("code")
          };
};

// TODO: set nodes selection
/*const NodesElection = {
    link: { isSelected },
    fontColor: { isSelectied},
    typography: { isSelected: false }
}*/

export const getSelectionTextFormat = (selection: RangeSelection): BlockSelectionTextFormat => {
    return !$isRangeSelection(selection)
        ? {
              italic: false,
              bold: false,
              underline: false,
              code: false
          }
        : {
              bold: selection.hasFormat("bold"),
              italic: selection.hasFormat("italic"),
              underline: selection.hasFormat("underline"),
              code: selection.hasFormat("code")
          };
};

/*
 * @desc Extract all data from the selection and provide
 */
const getTextBlockSelectionData = (
    activeEditor: LexicalEditor,
    selection: RangeSelection
): TextBlockSelection | null => {
    if ($isRangeSelection(selection)) {
        const anchorNode = selection.anchor.getNode();
        let element =
            anchorNode.getKey() === "root"
                ? anchorNode
                : $findMatchingParent(anchorNode, e => {
                      const parent = e.getParent();
                      return parent !== null && $isRootOrShadowRoot(parent);
                  });

        if (element === null) {
            element = anchorNode.getTopLevelElementOrThrow();
        }

        const elementKey = element.getKey();
        const elementDOM = activeEditor.getElementByKey(elementKey);

        // Update links
        const node = getSelectedNode(selection);
        const parent = node.getParent();
        const isElementDom = elementDOM !== null;

        return {
            // node/element data from selection
            elementKey,
            element,
            parentElement: parent,
            node,
            selection,
            isElementDom,
            // formatting and styles
            textFormat: getSelectionTextFormat(selection),
            blockType: "bullet"
        };
    }
    return null;
};
