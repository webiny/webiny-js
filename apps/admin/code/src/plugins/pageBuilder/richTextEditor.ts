import Delimiter from "@editorjs/delimiter";
import Quote from "@editorjs/quote";
import List from "@editorjs/list";
import Underline from "@editorjs/underline";
import Image from "@webiny/app-admin/components/RichTextEditor/tools/image";
import TextColor from "@webiny/app-admin/components/RichTextEditor/tools/textColor";
import Header from "@webiny/app-admin/components/RichTextEditor/tools/header";

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
            header: {
                class: Header,
                inlineToolbar: ["bold", "italic", "color"],
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
                shortcut: "CMD+M"
            }
        }
    }
};
