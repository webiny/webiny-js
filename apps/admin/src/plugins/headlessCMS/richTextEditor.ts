/**
 * Package @editorjs/* is missing types.
 */
// @ts-expect-error
import Delimiter from "@editorjs/delimiter";
// @ts-expect-error
import Quote from "@editorjs/quote";
// @ts-expect-error
import List from "@editorjs/list";
// @ts-expect-error
import Underline from "@editorjs/underline";
import Image from "@webiny/app-admin/components/RichTextEditor/tools/image";
import TextColor from "@webiny/app-admin/components/RichTextEditor/tools/textColor";
import Header from "@webiny/app-admin/components/RichTextEditor/tools/header";
import Paragraph from "@webiny/app-admin/components/RichTextEditor/tools/paragraph";
import { plugins } from "@webiny/plugins";
import { PbThemePlugin } from "@webiny/app-page-builder/types";

export default {
    type: "cms-rte-config",
    config: {
        tools: {
            delimiter: {
                class: Delimiter
            },
            paragraph: {
                class: Paragraph,
                inlineToolbar: ["bold", "italic", "underline", "color", "link"]
            },
            header: {
                class: Header,
                inlineToolbar: ["bold", "italic", "underline", "color", "link"],
                config: {
                    levels: [1, 2, 3, 4]
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
                    const [pbTheme] = plugins.byType<PbThemePlugin>("pb-theme");

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
