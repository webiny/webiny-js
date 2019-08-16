// @flow
import * as React from "react";
import { pure } from "recompose";
import { withCms } from "webiny-app-cms/context";
import { getPlugins } from "webiny-plugins";

const ImagesList = pure(({ data = {}, cms: { theme } }: Object = {}) => {
    const { component, images } = data;
    const components = getPlugins("pb-page-element-images-list-component");
    const imageList = components.find(cmp => cmp.name === component);

    if (!imageList) {
        return "Selected image gallery component not found!";
    }

    const { component: ListComponent } = imageList;
    if (!ListComponent) {
        return "You must select a component to render your image gallery!";
    }

    return <ListComponent data={images} theme={theme} />;
});

export default withCms()(ImagesList);
