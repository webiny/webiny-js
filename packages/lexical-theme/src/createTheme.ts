import type { EditorThemeClasses } from "lexical";

import "./theme.css";
import { ThemeEmotionMap } from "~/types";

export type WebinyTheme = {
    styles?: Record<string, any>;
    emotionMap?: ThemeEmotionMap;
};

export type EditorTheme = WebinyTheme & EditorThemeClasses;

const defaultTheme: EditorTheme = {
    styles: undefined,
    emotionMap: undefined,
    characterLimit: "WebinyLexical__characterLimit",
    code: "WebinyLexical__code",
    codeHighlight: {
        atrule: "WebinyLexical__tokenAttr",
        attr: "WebinyLexical__tokenAttr",
        boolean: "WebinyLexical__tokenProperty",
        builtin: "WebinyLexical__tokenSelector",
        cdata: "WebinyLexical__tokenComment",
        char: "WebinyLexical__tokenSelector",
        class: "WebinyLexical__tokenFunction",
        "class-name": "WebinyLexical__tokenFunction",
        comment: "WebinyLexical__tokenComment",
        constant: "WebinyLexical__tokenProperty",
        deleted: "WebinyLexical__tokenProperty",
        doctype: "WebinyLexical__tokenComment",
        entity: "WebinyLexical__tokenOperator",
        function: "WebinyLexical__tokenFunction",
        important: "WebinyLexical__tokenVariable",
        inserted: "WebinyLexical__tokenSelector",
        keyword: "WebinyLexical__tokenAttr",
        namespace: "WebinyLexical__tokenVariable",
        number: "WebinyLexical__tokenProperty",
        operator: "WebinyLexical__tokenOperator",
        prolog: "WebinyLexical__tokenComment",
        property: "WebinyLexical__tokenProperty",
        punctuation: "WebinyLexical__tokenPunctuation",
        regex: "WebinyLexical__tokenVariable",
        selector: "WebinyLexical__tokenSelector",
        string: "WebinyLexical__tokenSelector",
        symbol: "WebinyLexical__tokenProperty",
        tag: "WebinyLexical__tokenProperty",
        url: "WebinyLexical__tokenOperator",
        variable: "WebinyLexical__tokenVariable"
    },
    embedBlock: {
        base: "WebinyLexical__embedBlock",
        focus: "WebinyLexical__embedBlockFocus"
    },
    hashtag: "WebinyLexical__hashtag",
    heading: {
        h1: "WebinyLexical__h1",
        h2: "WebinyLexical__h2",
        h3: "WebinyLexical__h3",
        h4: "WebinyLexical__h4",
        h5: "WebinyLexical__h5",
        h6: "WebinyLexical__h6"
    },
    link: "WebinyLexical__link",
    list: {
        listitem: "WebinyLexical__listItem",
        listitemChecked: "WebinyLexical__listItemChecked",
        listitemUnchecked: "WebinyLexical__listItemUnchecked",
        nested: {
            listitem: "WebinyLexical__nestedListItem"
        },
        olDepth: [
            "WebinyLexical__ol1",
            "WebinyLexical__ol2",
            "WebinyLexical__ol3",
            "WebinyLexical__ol4",
            "WebinyLexical__ol5"
        ],
        ul: "WebinyLexical__ul"
    },
    ltr: "WebinyLexical__ltr",
    mark: "WebinyLexical__mark",
    markOverlap: "WebinyLexical__markOverlap",
    paragraph: "WebinyLexical__paragraph",
    quote: "WebinyLexical__quote",
    rtl: "WebinyLexical__rtl",
    text: {
        bold: "WebinyLexical__textBold",
        code: "WebinyLexical__textCode",
        italic: "WebinyLexical__textItalic",
        strikethrough: "WebinyLexical__textStrikethrough",
        subscript: "WebinyLexical__textSubscript",
        superscript: "WebinyLexical__textSuperscript",
        underline: "WebinyLexical__textUnderline",
        underlineStrikethrough: "WebinyLexical__textUnderlineStrikethrough"
    },
    fontColorText: "WebinyLexical__fontColorText",
    image: "editor-image",
    indent: "PlaygroundEditorTheme__indent",
    inlineImage: "inline-editor-image"
};

export const createTheme = (): EditorTheme => {
    return defaultTheme;
};
