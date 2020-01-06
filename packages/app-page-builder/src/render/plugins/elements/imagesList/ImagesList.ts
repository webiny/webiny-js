// @flow
import * as React from "react";
import warning from "warning";
import { getPlugins } from "@webiny/plugins";

const ImagesList = React.memo((props: Object = {}) => {
    const { data = {} } = props;
    const { component } = data;
    const pageList = getPlugins("pb-page-element-images-list-component").find(
        cmp => cmp.componentName === component
    );
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
});

export default ImagesList;
