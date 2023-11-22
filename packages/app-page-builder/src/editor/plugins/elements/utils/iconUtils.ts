import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { plugins } from "@webiny/plugins";
import { PbIcon, PbIconsPlugin } from "~/types";
import { PostModifyElementArgs } from "../../elementSettings/useUpdateHandlers";
import { IconProp } from "@fortawesome/fontawesome-svg-core";

let icons: PbIcon[];
const getIcons = (): PbIcon[] => {
    if (!icons) {
        const pluginsByType = plugins.byType<PbIconsPlugin>("pb-icons");
        icons = pluginsByType.reduce((icons, pl) => {
            return icons.concat(pl.getIcons());
        }, [] as PbIcon[]);
    }
    return icons;
};
interface GetSvgProps {
    width?: number;
    color?: string;
}

const getSvg = (id: IconProp | undefined, props: GetSvgProps = {}): string | undefined => {
    if (!props.width) {
        props.width = 50;
    }
    if (!Array.isArray(id)) {
        return undefined;
    }
    const icon = getIcons().find(ic => ic.id[0] === id[0] && ic.id[1] === id[1]);
    if (!icon) {
        return undefined;
    }
    return renderToStaticMarkup(React.cloneElement(icon.svg, props));
};
interface IconData {
    id?: string;
    width?: number;
    color?: string;
    position?: string;
}
const updateButtonElementIcon = ({ name, newElement, element }: PostModifyElementArgs): void => {
    const icon: IconData = element?.data || {};

    const isIcon = name.startsWith("icon");
    if (!isIcon) {
        return;
    }
    const { id, width, color, position } = newElement.data?.icon || {};

    const isSameIconProps =
        icon.width === width && icon.color === color && icon.position === position;
    let isSelectedIcon = false;

    if (isSameIconProps && Array.isArray(id) && icon.id) {
        isSelectedIcon = icon.id[0] === id[0] && icon.id[1] === id[1];
    }

    const updatedIcon = isSelectedIcon ? {} : newElement.data.icon || {};
    // Modify the element directly.
    newElement.data.icon = {
        ...updatedIcon,
        // By setting "svg" as "null" we can truly reset it;
        // otherwise "undefined" will be overridden during merge.
        svg: id && !isSelectedIcon ? getSvg(id, { width, color }) : undefined
    };
};

const updateIconElement = ({ newElement }: PostModifyElementArgs): void => {
    if (!newElement.data.icon) {
        console.log(`Missing data.icon on element "${newElement.id}".`);
        return;
    }
    const { id, width, color } = newElement.data.icon;
    // Modify the element directly.
    newElement.data.icon.svg = getSvg(id, { width, color });
};

export { getSvg, updateButtonElementIcon, updateIconElement };
