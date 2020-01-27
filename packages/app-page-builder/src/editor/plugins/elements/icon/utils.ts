import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { getPlugins } from "@webiny/plugins";
import { isEqual } from "lodash";
import { PbIcon, PbIconsPlugin } from "@webiny/app-page-builder/types";

let icons: PbIcon[];
export const getIcons = () => {
    if (!icons) {
        const plugins = getPlugins("pb-icons") as PbIconsPlugin[];
        icons = plugins.reduce((icons, pl) => {
            return icons.concat(pl.getIcons());
        }, []);
    }
    return icons;
};

export const getSvg = (id: Array<string>, props?: any) => {
    if (!props.width) {
        props.width = 50;
    }
    const icon = getIcons().find(ic => isEqual(ic.id, id));
    if (!icon) {
        return null;
    }
    return renderToStaticMarkup(React.cloneElement(icon.svg, props));
};
