import { LexicalEditorTheme } from "~/types/LexicalEditorTheme";

export const createDefaultLexicalTheme = (): LexicalEditorTheme => {
    return {
        characterLimit: "wb-lx-characterLimit",
        code: "wb-lx-code",
        codeHighlight: {
            atrule: "wb-lx-tokenAttr",
            attr: "wb-lx-tokenAttr",
            boolean: "wb-lx-tokenProperty",
            builtin: "wb-lx-tokenSelector",
            cdata: "wb-lx-tokenComment",
            char: "wb-lx-tokenSelector",
            class: "wb-lx-tokenFunction",
            "class-name": "wb-lx-tokenFunction",
            comment: "wb-lx-tokenComment",
            constant: "wb-lx-tokenProperty",
            deleted: "wb-lx-tokenProperty",
            doctype: "wb-lx-tokenComment",
            entity: "wb-lx-tokenOperator",
            function: "wb-lx-tokenFunction",
            important: "wb-lx-tokenVariable",
            inserted: "wb-lx-tokenSelector",
            keyword: "wb-lx-tokenAttr",
            namespace: "wb-lx-tokenVariable",
            number: "wb-lx-tokenProperty",
            operator: "wb-lx-tokenOperator",
            prolog: "wb-lx-tokenComment",
            property: "wb-lx-tokenProperty",
            punctuation: "wb-lx-tokenPunctuation",
            regex: "wb-lx-tokenVariable",
            selector: "wb-lx-tokenSelector",
            string: "wb-lx-tokenSelector",
            symbol: "wb-lx-tokenProperty",
            tag: "wb-lx-tokenProperty",
            url: "wb-lx-tokenOperator",
            variable: "wb-lx-tokenVariable"
        },
        embedBlock: {
            base: "wb-lx-embedBlock",
            focus: "wb-lx-embedBlockFocus"
        },
        hashtag: "wb-lx-hashtag",
        heading: {
            h1: "wb-lx-h1",
            h2: "wb-lx-h2",
            h3: "wb-lx-h3",
            h4: "wb-lx-h4",
            h5: "wb-lx-h5",
            h6: "wb-lx-h6"
        },
        link: "wb-lx-link",
        list: {
            listitem: "wb-lx-listItem",
            listitemChecked: "wb-lx-listItemChecked",
            listitemUnchecked: "wb-lx-listItemUnchecked",
            nested: {
                listitem: "wb-lx-nestedListItem"
            },
            olDepth: ["wb-lx-ol1", "wb-lx-ol2", "wb-lx-ol3", "wb-lx-ol4", "wb-lx-ol5"],
            ul: "wb-lx-ul"
        },
        ltr: "wb-lx-ltr",
        mark: "wb-lx-mark",
        markOverlap: "wb-lx-markOverlap",
        paragraph: "wb-lx-paragraph",
        quote: "wb-lx-quote",
        rtl: "wb-lx-rtl",
        text: {
            bold: "wb-lx-textBold",
            code: "wb-lx-textCode",
            italic: "wb-lx-textItalic",
            strikethrough: "wb-lx-textStrikethrough",
            subscript: "wb-lx-textSubscript",
            superscript: "wb-lx-textSuperscript",
            underline: "wb-lx-textUnderline",
            underlineStrikethrough: "wb-lx-textUnderlineStrikethrough"
        },
        fontColorText: "wb-lx-fontColorText",
        image: "wb-lx-image",
        indent: "wb-lx-indent",
        inlineImage: "wb-lx-inline-image"
    };
};
