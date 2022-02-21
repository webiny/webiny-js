import React from "react";
import cloneDeep from "lodash/cloneDeep";
import { plugins } from "@webiny/plugins";
import { Image } from "@webiny/ui/Image";
import { PbEditorBlockPlugin } from "~/types";

export interface BlockElement {
    id: string;
    name: string;
    type: string;
    category: string;
    content: any;
    preview: {
        src: string;
        meta: {
            width: number;
            height: number;
            aspectRatio: number;
        };
    };
}

export default (element: BlockElement) => {
    const plugin: PbEditorBlockPlugin = {
        id: element.id,
        name: "pb-saved-block-" + element.id,
        type: "pb-editor-block",
        title: element.name,
        category: element.category,
        tags: ["saved"],
        image: element.preview,
        create() {
            return cloneDeep({ ...element.content, source: element.id });
        },
        preview() {
            return (
                <Image
                    src={element.preview.src}
                    alt={element.name}
                    style={{ width: "100%", height: "auto" }}
                />
            );
        }
    };
    plugins.register(plugin);
};
