// @flow
import * as React from "react";
import { usePageBuilder } from "@webiny/app-page-builder/hooks/usePageBuilder";
import { getPlugins } from "@webiny/plugins";

const ImagesList = React.memo(({ data = {} }: Object = {}) => {
    const { theme } = usePageBuilder();
    const { component, images } = data;
    const components = getPlugins("pb-page-element-images-list-component");
    const imageList = components.find(cmp => cmp.componentName === component);

    if (!imageList) {
        return "Selected image gallery component not found!";
    }

    const { component: ListComponent } = imageList;
    if (!ListComponent) {
        return "You must select a component to render your image gallery!";
    }

    return <ListComponent data={images} theme={theme} />;
});

export default ImagesList;
