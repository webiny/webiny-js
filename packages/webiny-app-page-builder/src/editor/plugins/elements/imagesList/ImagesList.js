// @flow
import * as React from "react";
import { pure } from "recompose";
import { withPageBuilder } from "webiny-app-page-builder/context";
import { getPlugins } from "webiny-plugins";

const ImagesList = pure(({ data = {}, pageBuilder: { theme } }: Object = {}) => {
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

export default withPageBuilder()(ImagesList);
