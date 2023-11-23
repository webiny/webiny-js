import React from "react";
import { plugins } from "@webiny/plugins";
import { PbEditorBlockPlugin, PbPageBlock } from "~/types";
import { PreviewBlock } from "~/admin/components/PreviewBlock";

export const createBlockPlugin = (pageBlock: PbPageBlock): void => {
    const plugin: PbEditorBlockPlugin = {
        id: pageBlock.id,
        name: "pb-saved-block-" + pageBlock.id,
        type: "pb-editor-block",
        title: pageBlock.name,
        blockCategory: pageBlock.blockCategory,
        tags: ["saved"],
        create() {
            return structuredClone({ ...pageBlock.content, source: pageBlock.id });
        },
        preview() {
            return <PreviewBlock element={pageBlock} />;
        }
    };
    plugins.register(plugin);
};
