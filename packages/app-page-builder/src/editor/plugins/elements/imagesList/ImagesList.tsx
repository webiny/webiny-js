import * as React from "react";
import { usePageBuilder } from "@webiny/app-page-builder/hooks/usePageBuilder";
import { getPlugins } from "@webiny/plugins";
import { PbPageElementImagesListComponentPlugin } from "@webiny/app-page-builder/types";

const ImagesList = ({ data }) => {
    const { theme } = usePageBuilder();
    const { component, images } = data;
    const components = getPlugins<PbPageElementImagesListComponentPlugin>(
        "pb-editor-page-element-images-list-component"
    );
    const imageList = components.find(cmp => cmp.componentName === component);

    if (!imageList) {
        return <div>Selected image gallery component not found!</div>;
    }

    const { component: ListComponent } = imageList;
    if (!ListComponent) {
        return <div>You must select a component to render your image gallery!</div>;
    }

    return <ListComponent data={images} theme={theme} />;
};

export default React.memo(ImagesList);
