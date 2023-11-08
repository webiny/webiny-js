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

interface Icons {
    definitions: Record<IconPrefix, Record<IconName, string[]>>;
}

const plugin: CmsIconsPlugin = {
    name: "cms-icons-fontawesome",
    type: "cms-icons",
    init() {
        /**
         * Ignoring TS errors. We know what we did here is good, but cannot get it to work with typescript.
         */
        // @ts-expect-error
        library.add(fab, fas, far);
        const definitions = (library as unknown as Icons).definitions;
        // @ts-expect-error
        Object.keys(definitions).forEach((pack: IconPrefix) => {
            const defs = definitions[pack];
            // @ts-expect-error
            Object.keys(defs).forEach((icon: IconName) => {
                icons.push({
                    id: [pack, icon],
                    name: icon,
                    // @ts-ignore
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
