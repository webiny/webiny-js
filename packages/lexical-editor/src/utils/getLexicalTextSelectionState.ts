import {
    TextBlockSelectionFormat,
    LexicalTextSelection,
    ToolbarState,
    TypographyValue
} from "~/types";
import {
    $isParagraphNode,
    $isRangeSelection,
    $isRootOrShadowRoot,
    ElementNode,
    LexicalEditor,
    LexicalNode,
    RangeSelection,
    TextNode
} from "lexical";
import { $findMatchingParent, $getNearestNodeOfType } from "@lexical/utils";
import { getSelectedNode } from "~/utils/getSelectedNode";
import { $isLinkNode } from "@lexical/link";
import { $isWebinyListNode, WebinyListNode } from "~/nodes/list-node/WebinyListNode";
import { $isHeadingNode, $isQuoteNode } from "@lexical/rich-text";
import { $isTypographyElementNode } from "~/nodes/TypographyElementNode";
import { $isFontColorNode } from "~/nodes/FontColorNode";

export const getSelectionTextFormat = (
    selection: RangeSelection | undefined
): TextBlockSelectionFormat => {
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

const getDefaultToolbarState = (): ToolbarState => {
    return {
        bold: false,
        italic: false,
        underline: false,
        code: false,
        link: { isSelected: false },
        list: { isSelected: false },
        typography: { isSelected: false },
        fontColor: { isSelected: false },
        quote: { isSelected: false },
        textBlockType: undefined
    };
};

export const getToolbarState = (
    selection: RangeSelection,
    node: LexicalNode,
    parent: LexicalNode | null,
    element: LexicalNode | null,
    anchorNode: ElementNode | TextNode
): ToolbarState => {
    const textFormat = getSelectionTextFormat(selection);
    let state: ToolbarState = getDefaultToolbarState();
    state = {
        ...state,
        bold: textFormat.bold,
        italic: textFormat.italic,
        underline: textFormat.underline,
        code: textFormat.code
    };

    // link
    state.link.isSelected = $isLinkNode(parent) || $isLinkNode(node);
    if (state.link.isSelected) {
        state.textBlockType = "link";
    }
    // font color
    if ($isFontColorNode(node)) {
        state.fontColor.isSelected = true;
    }
    if ($isWebinyListNode(element)) {
        const parentList = $getNearestNodeOfType<WebinyListNode>(anchorNode, WebinyListNode);
        const type = parentList ? parentList.getListType() : element.getListType();
        state.textBlockType = type;
    }
    if ($isHeadingNode(node)) {
        state.textBlockType = "heading";
    }
    if ($isParagraphNode(element)) {
        state.textBlockType = "paragraph";
    }
    if ($isTypographyElementNode(element)) {
        state.typography.isSelected = true;
        const value = element?.getTypographyValue() as TypographyValue;
        if (value.tag.includes("h")) {
            state.textBlockType = "heading";
        }
        if (value.tag.includes("p")) {
            state.textBlockType = "paragraph";
        }
    }
    if ($isTypographyElementNode(element)) {
        state.fontColor.isSelected = true;
    }
    if ($isQuoteNode(element)) {
        state.textBlockType = "quoteblock";
        state.quote.isSelected = true;
    }

    return state;
};

/*
 * @desc Extract all data from the selection and provide
 */
export const getLexicalTextSelectionState = (
    activeEditor: LexicalEditor,
    selection: RangeSelection
): LexicalTextSelection | null => {
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
            parent,
            node,
            anchorNode,
            selection,
            isElementDom,
            state: getToolbarState(selection, node, parent, element, anchorNode)
        };
    }
    return null;
};
