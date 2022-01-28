import React from "react";
import { IconName, library } from "@fortawesome/fontawesome-svg-core";
import { IconPrefix } from "@fortawesome/fontawesome-common-types";
import { fab } from "@fortawesome/free-brands-svg-icons";
import { fas } from "@fortawesome/free-solid-svg-icons";
import { far } from "@fortawesome/free-regular-svg-icons";
import { CmsIcon, CmsIconsPlugin } from "~/types";

const createSvg = (icon: string[]): React.ReactElement => {
    return (
        <svg width={24} viewBox={`0 0 ${icon[0]} ${icon[1]}`}>
            <path d={icon[4]} fill="currentColor" />
        </svg>
    );
};

const icons: CmsIcon[] = [];

const plugin: CmsIconsPlugin = {
    name: "cms-icons-fontawesome",
    type: "cms-icons",
    init() {
        library.add(fab, fas, far);
        // @ts-ignore
        const definitions = library.definitions;
        Object.keys(definitions).forEach((pack: IconPrefix) => {
            const defs = definitions[pack];
            Object.keys(defs).forEach((icon: IconName) => {
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
