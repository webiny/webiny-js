import React from "react";
import cloneDeep from "lodash/cloneDeep";
import { plugins } from "@webiny/plugins";
import { PbEditorBlockPlugin, PbPageBlock } from "~/types";
import { PreviewBlock } from "~/admin/components/PreviewBlock";

export default (element: PbPageBlock): void => {
    const plugin: PbEditorBlockPlugin = {
        id: element.id,
        name: "pb-saved-block-" + element.id,
        type: "pb-editor-block",
        title: element.name,
        blockCategory: element.blockCategory,
        tags: ["saved"],
        create() {
            return cloneDeep({ ...element.content, source: element.id });
        },
        preview() {
            return <PreviewBlock element={element} />;
        }
    };
    plugins.register(plugin);
};
