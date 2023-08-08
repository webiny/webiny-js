import { TextFormatting, TextBlockSelection, ToolbarState, TypographyValue } from "~/types";
import {
    $isParagraphNode as $isBaseParagraphNode,
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
import { $isListNode, ListNode } from "~/nodes/ListNode";
import { $isHeadingNode as $isBaseHeadingNode } from "@lexical/rich-text";
import { $isTypographyElementNode } from "~/nodes/TypographyElementNode";
import { $isFontColorNode } from "~/nodes/FontColorNode";
import { $isParagraphNode } from "~/nodes/ParagraphNode";
import { $isHeadingNode } from "~/nodes/HeadingNode";
import { $isQuoteNode } from "~/nodes/QuoteNode";
import { $isParentElementRTL } from "@lexical/selection";

export const getSelectionTextFormat = (selection: RangeSelection | undefined): TextFormatting => {
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
        isRTL: false,
        link: { isSelected: false },
        list: { isSelected: false },
        typography: { isSelected: false },
        fontColor: { isSelected: false },
        quote: { isSelected: false },
        paragraph: { isSelected: false },
        heading: { isSelected: false },
        textType: undefined
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

    state.isRTL = $isParentElementRTL(selection);

    // link
    state.link.isSelected = $isLinkNode(parent) || $isLinkNode(node);
    if (state.link.isSelected) {
        state.textType = "link";
    }

    // font color
    if ($isFontColorNode(node)) {
        state.fontColor.isSelected = true;
    }

    if ($isListNode(element)) {
        const parentList = $getNearestNodeOfType<ListNode>(anchorNode, ListNode);
        const type = parentList ? parentList.getListType() : element.getListType();
        state.list.isSelected = true;
        state.textType = type;
    }

    if ($isBaseHeadingNode(element)) {
        state.textType = "heading";
    }

    if ($isHeadingNode(element)) {
        state.textType = "heading";
        state.heading.isSelected = true;
    }

    if ($isBaseParagraphNode(element)) {
        state.textType = "paragraph";
    }

    if ($isParagraphNode(element)) {
        state.textType = "paragraph";
        state.paragraph.isSelected = true;
    }

    if ($isTypographyElementNode(element)) {
        state.typography.isSelected = true;
        const value = element?.getTypographyValue() as TypographyValue;
        if (value.tag.includes("h")) {
            state.textType = "heading";
        }
        if (value.tag.includes("p")) {
            state.textType = "paragraph";
        }
    }

    if ($isTypographyElementNode(element)) {
        state.fontColor.isSelected = true;
    }

    if ($isQuoteNode(element)) {
        state.textType = "quoteblock";
        state.quote.isSelected = true;
    }

    return state;
};

/*
 * @desc Get selection data and provide processed toolbar state and data about the text, element and parent nodes.
 */
export const getLexicalTextSelectionState = (
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
        const selectedText = selection.getTextContent();

        return {
            // node/element data from selection
            elementKey,
            element,
            parent,
            node,
            anchorNode,
            selection,
            isElementDom,
            selectedText,
            state: getToolbarState(selection, node, parent, element, anchorNode)
        };
    }
    return null;
};
