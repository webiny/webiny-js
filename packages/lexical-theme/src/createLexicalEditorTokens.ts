import type { EditorThemeClasses } from "lexical";

export const createLexicalTokens = (classPrefix: string): EditorThemeClasses => {
    const withPrefix = (className: string) => {
        return `${classPrefix}${className}`;
    };

    return {
        characterLimit: withPrefix("characterLimit"),
        code: withPrefix("code"),
        codeHighlight: {
            atrule: withPrefix("tokenAttr"),
            attr: withPrefix("tokenAttr"),
            boolean: withPrefix("tokenProperty"),
            builtin: withPrefix("tokenSelector"),
            cdata: withPrefix("tokenComment"),
            char: withPrefix("tokenSelector"),
            class: withPrefix("tokenFunction"),
            "class-name": withPrefix("tokenFunction"),
            comment: withPrefix("tokenComment"),
            constant: withPrefix("tokenProperty"),
            deleted: withPrefix("tokenProperty"),
            doctype: withPrefix("tokenComment"),
            entity: withPrefix("tokenOperator"),
            function: withPrefix("tokenFunction"),
            important: withPrefix("tokenVariable"),
            inserted: withPrefix("tokenSelector"),
            keyword: withPrefix("tokenAttr"),
            namespace: withPrefix("tokenVariable"),
            number: withPrefix("tokenProperty"),
            operator: withPrefix("tokenOperator"),
            prolog: withPrefix("tokenComment"),
            property: withPrefix("tokenProperty"),
            punctuation: withPrefix("tokenPunctuation"),
            regex: withPrefix("tokenVariable"),
            selector: withPrefix("tokenSelector"),
            string: withPrefix("tokenSelector"),
            symbol: withPrefix("tokenProperty"),
            tag: withPrefix("tokenProperty"),
            url: withPrefix("tokenOperator"),
            variable: withPrefix("tokenVariable")
        },
        embedBlock: {
            base: withPrefix("embedBlock"),
            focus: withPrefix("embedBlockFocus")
        },
        hashtag: withPrefix("hashtag"),
        heading: {
            h1: withPrefix("h1"),
            h2: withPrefix("h2"),
            h3: withPrefix("h3"),
            h4: withPrefix("h4"),
            h5: withPrefix("h5"),
            h6: withPrefix("h6")
        },
        link: withPrefix("link"),
        list: {
            listitem: withPrefix("listItem"),
            listitemChecked: withPrefix("listItemChecked"),
            listitemUnchecked: withPrefix("listItemUnchecked"),
            nested: {
                listitem: withPrefix("nestedListItem")
            },
            olDepth: [
                withPrefix("ol1"),
                withPrefix("ol2"),
                withPrefix("ol3"),
                withPrefix("ol4"),
                withPrefix("ol5")
            ],
            ul: withPrefix("ul")
        },
        ltr: withPrefix("ltr"),
        mark: withPrefix("mark"),
        markOverlap: withPrefix("markOverlap"),
        paragraph: withPrefix("paragraph"),
        quote: withPrefix("quote"),
        rtl: withPrefix("rtl"),
        text: {
            bold: withPrefix("textBold"),
            code: withPrefix("textCode"),
            italic: withPrefix("textItalic"),
            strikethrough: withPrefix("textStrikethrough"),
            subscript: withPrefix("textSubscript"),
            superscript: withPrefix("textSuperscript"),
            underline: withPrefix("textUnderline"),
            underlineStrikethrough: withPrefix("textUnderlineStrikethrough")
        },
        fontColorText: withPrefix("fontColorText"),
        image: withPrefix("image"),
        indent: withPrefix("indent"),
        inlineImage: withPrefix("inline-image"),
        table: withPrefix("table"),
        tableAddColumns: withPrefix("tableAddColumns"),
        tableAddRows: withPrefix("tableAddRows"),
        tableCellActionButton: withPrefix("tableCellActionButton"),
        tableCellActionButtonContainer: withPrefix("tableCellActionButtonContainer"),
        tableCellSelected: withPrefix("tableCellSelected"),
        tableCell: withPrefix("tableCell"),
        tableCellHeader: withPrefix("tableCellHeader"),
        tableCellResizer: withPrefix("tableCellResizer"),
        tableRow: withPrefix("tableRow"),
        tableScrollableWrapper: withPrefix("tableScrollableWrapper"),
        tableSelected: withPrefix("tableSelected"),
        tableSelection: withPrefix("tableSelection")
    };
};
