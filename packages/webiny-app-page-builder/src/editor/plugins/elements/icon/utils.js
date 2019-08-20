// @flow
import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { getPlugins } from "webiny-plugins";
import { isEqual } from "lodash";

let icons;
export const getIcons = () => {
    if (!icons) {
        icons = getPlugins("pb-icons").reduce((icons: Array<Object>, pl: Object) => {
            return icons.concat(pl.getIcons());
        }, []);
    }
    return icons;
};

export const getSvg = (id: Array<string>, props?: Object = {}) => {
    if (!props.width) {
        props.width = 50;
    }
    const icon = getIcons().find(ic => isEqual(ic.id, id));
    if (!icon) {
        return null;
    }
    return renderToStaticMarkup(React.cloneElement(icon.svg, props));
};
