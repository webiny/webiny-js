import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { IconProp } from "@fortawesome/fontawesome-svg-core";
import { plugins } from "@webiny/plugins";
import { PbEditorBlockCategoryPlugin, PbBlockCategory } from "~/types";

interface IconProps {
    category: PbBlockCategory;
}

export const Icon = ({ category }: IconProps) => {
    return (
        <FontAwesomeIcon
            style={{ color: "var(--mdc-theme-text-secondary-on-background)", fontSize: "24px" }}
            icon={(category.icon || "").split("/") as IconProp}
        />
    );
};

export default (element: PbBlockCategory): void => {
    const plugin: PbEditorBlockCategoryPlugin = {
        type: "pb-editor-block-category",
        name: "pb-editor-block-category-" + element.slug,
        title: element.name,
        categoryName: element.slug,
        description: element.description || "",
        icon: <Icon category={element} />
    };

    plugins.register(plugin);
};
