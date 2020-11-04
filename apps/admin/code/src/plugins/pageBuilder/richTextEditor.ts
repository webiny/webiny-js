import Delimiter from "@editorjs/delimiter";
import Header from "@editorjs/header";
import Quote from "@editorjs/quote";
import List from "@editorjs/list";
import Underline from "@editorjs/underline";
import Image from "@webiny/app-admin/components/RichTextEditor/tools/image";

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
            }
        }
    }
};
