import { PbPageElementImagesListComponentPlugin } from "~/types";
import { createImagesList } from "@webiny/app-page-builder-elements/renderers/imagesList";
import { plugins } from "@webiny/plugins";
import { useElementVariableValue } from "~/editor/hooks/useElementVariableValue";
import { Element } from "@webiny/app-page-builder-elements/types";
import React from "react";

const ImagesList = createImagesList({
    imagesListComponents: () => {
        const registeredPlugins = plugins.byType<PbPageElementImagesListComponentPlugin>(
            "pb-page-element-images-list-component"
        );

        return registeredPlugins.map(plugin => {
            return {
                id: plugin.componentName,
                name: plugin.title,
                component: plugin.component
            };
        });
    }
});

interface Props {
    element: Element;
}

const PeImagesList = (props: Props) => {
    const { element } = props;
    const variableValue = useElementVariableValue(element);
    if (variableValue) {
        return <ImagesList {...props} images={variableValue} />;
    }

    return <ImagesList {...props} />;
};

export default PeImagesList;
