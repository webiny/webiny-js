import React from "react";
import { plugins } from "@webiny/plugins";
import { PbEditorBlockCategoryPlugin, PbBlockCategory } from "~/types";

export default (element: PbBlockCategory): void => {
    const plugin: PbEditorBlockCategoryPlugin = {
        type: "pb-editor-block-category",
        name: "pb-editor-block-category-" + element.slug,
        title: element.name,
        categoryName: element.slug,
        description: "",
        icon: <></>
    };

    plugins.register(plugin);
};
