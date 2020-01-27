import * as React from "react";
import warning from "warning";
import { getPlugins } from "@webiny/plugins";
import { PbPageElementImagesListComponentPlugin } from "@webiny/app-page-builder/types";

const ImagesList = props => {
    const { data = {} } = props;
    const { component } = data;
    const plugins = getPlugins(
        "pb-page-element-images-list-component"
    ) as PbPageElementImagesListComponentPlugin[];

    const pageList = plugins.find(cmp => cmp.componentName === component);
    if (!pageList) {
        warning(false, `Pages list component "${component}" is missing!`);
        return null;
    }

    const { component: ListComponent } = pageList;

    if (!ListComponent) {
        warning(false, `React component is not defined for "${component}"!`);
        return null;
    }

    return null;
};

export default React.memo(ImagesList);
