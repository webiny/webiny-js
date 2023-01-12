import React from "react";
import cloneDeep from "lodash/cloneDeep";
import { plugins } from "@webiny/plugins";
import { Image } from "@webiny/ui/Image";
import { PbEditorBlockPlugin, PbPageBlock } from "~/types";

export default (element: PbPageBlock): void => {
    const plugin: PbEditorBlockPlugin = {
        id: element.id,
        name: "pb-saved-block-" + element.id,
        type: "pb-editor-block",
        title: element.name,
        blockCategory: element.blockCategory,
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
