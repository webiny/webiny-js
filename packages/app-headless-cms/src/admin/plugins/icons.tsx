import * as React from "react";
import { library } from "@fortawesome/fontawesome-svg-core";
import { fab } from "@fortawesome/free-brands-svg-icons";
import { fas } from "@fortawesome/free-solid-svg-icons";
import { far } from "@fortawesome/free-regular-svg-icons";
import { CmsIconsPlugin } from "@webiny/app-headless-cms/types";

const createSvg = icon => {
    return (
        <svg width={24} viewBox={`0 0 ${icon[0]} ${icon[1]}`}>
            <path d={icon[4]} fill="currentColor" />
        </svg>
    );
};

const icons = [];

const plugin: CmsIconsPlugin = {
    name: "cms-icons-fontawesome",
    type: "cms-icons",
    init() {
        library.add(fab, fas, far);
        // @ts-ignore
        const definitions = library.definitions;
        Object.keys(definitions).forEach(pack => {
            const defs = definitions[pack];
            Object.keys(defs).forEach(icon => {
                icons.push({
                    id: [pack, icon],
                    name: icon,
                    svg: createSvg(defs[icon])
                });
            });
        });
    },
    getIcons() {
        return icons;
    }
};

export default plugin;
