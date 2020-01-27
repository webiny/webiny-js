import React from "react";
import cloneDeep from "lodash/cloneDeep";
import { registerPlugins } from "@webiny/plugins";
import { Image } from "@webiny/ui/Image";
import { PbEditorBlockPlugin } from "@webiny/app-page-builder/types";

type BlockElement = {
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
};

export default (el: BlockElement) => {
    registerPlugins({
        id: el.id,
        name: "pb-saved-block-" + el.id,
        type: "pb-editor-block",
        title: el.name,
        category: el.category,
        tags: ["saved"],
        image: el.preview,
        create() {
            return cloneDeep({ ...el.content, source: el.id });
        },
        preview() {
            return (
                <Image
                    src={el.preview.src}
                    alt={el.name}
                    style={{ width: "100%", height: "auto" }}
                />
            );
        }
    } as PbEditorBlockPlugin);
};
