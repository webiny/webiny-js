import Delimiter from "@editorjs/delimiter";
import Quote from "@editorjs/quote";
import List from "@editorjs/list";
import Underline from "@editorjs/underline";
import Image from "@webiny/app-admin/components/RichTextEditor/tools/image";
import TextColor from "@webiny/app-admin/components/RichTextEditor/tools/textColor";
import Header from "@webiny/app-admin/components/RichTextEditor/tools/header";
import Paragraph from "@webiny/app-admin/components/RichTextEditor/tools/paragraph";
import { plugins } from "@webiny/plugins";

/**
 * This file contains a RichTextEditor configuration used in Page Builder app.
 */

export default {
    type: "pb-rte-config",
    config: {
        tools: {
            delimiter: {
                class: Delimiter
            },
            paragraph: {
                class: Paragraph,
                inlineToolbar: ["bold", "italic", "underline", "color", "link"],
                config: () => {
                    const [pbTheme] = plugins.byType("pb-theme");
                    const typography = pbTheme.theme.typography;
                    // Use typography options only for "p" tag.
                    const typographyForParagraph = {
                        paragraph: typography.paragraph,
                        description: typography.description
                    };
                    return {
                        typography: typographyForParagraph
                    };
                }
            },
            header: {
                class: Header,
                inlineToolbar: ["bold", "italic", "underline", "color", "link"],
                config: () => {
                    const [pbTheme] = plugins.byType("pb-theme");
                    const typography = pbTheme.theme.typography;

                    return {
                        typography,
                        levels: [1, 2, 3, 4, 5, 6]
                    };
                }
            },
            image: {
                class: Image
            },
            quote: {
                class: Quote
            },
            list: {
                class: List
            },
            underline: {
                class: Underline
            },
            color: {
                class: TextColor,
                shortcut: "CMD+M",
                config: () => {
                    const [pbTheme] = plugins.byType("pb-theme");

                    const themeColors = pbTheme
                        ? Object.values(pbTheme.theme.colors)
                        : ["#8c7ae6", "#0097e6", "#44bd32"];

                    return {
                        themeColors
                    };
                }
            }
        },
        /**
         * This Tool will be used as default
         */
        defaultBlock: "paragraph"
    }
};
