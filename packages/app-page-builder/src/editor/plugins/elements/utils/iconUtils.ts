import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { plugins } from "@webiny/plugins";
import get from "lodash/get";
import { PbIcon, PbIconsPlugin } from "~/types";
import { PostModifyElementArgs } from "../../elementSettings/useUpdateHandlers";
// TODO: check is it possible to dynamically add icons?
// if yes, this wont work
let icons: PbIcon[];
const getIcons = (): PbIcon[] => {
    if (!icons) {
        const pluginsByType = plugins.byType<PbIconsPlugin>("pb-icons");
        icons = pluginsByType.reduce((icons, pl) => {
            return icons.concat(pl.getIcons());
        }, []);
    }
    return icons;
};

const getSvg = (id: string[], props: Record<string, any> = {}): string => {
    if (!props.width) {
        props.width = 50;
    }
    const icon: PbIcon = getIcons().find(ic => ic.id[0] === id[0] && ic.id[1] === id[1]);
    if (!icon) {
        return null;
    }
    return renderToStaticMarkup(React.cloneElement(icon.svg, props));
};

const updateButtonElementIcon = ({ name, newElement, element }: PostModifyElementArgs): void => {
    const icon = element?.data || {};

    const isIcon = name.startsWith("icon");
    if (!isIcon) {
        return;
    }
    const { id, width, color, position } = newElement.data?.icon || {};

    const isSameIconProps =
        icon.width === width && icon.color === color && icon.position === position;
    let isSelectedIcon = false;

    if (isSameIconProps && id && icon?.id) {
        isSelectedIcon = icon.id[0] === id[0] && icon.id[1] === id[1];
    }

    const updatedIcon = isSelectedIcon ? {} : newElement.data.icon || {};
    // Modify the element directly.
    newElement.data.icon = {
        ...updatedIcon,
        // By setting "svg" as "null" we can truly reset it;
        // otherwise "undefined" will be overridden during merge.
        svg: id && !isSelectedIcon ? getSvg(id, { width, color }) : null
    };
};

const updateIconElement = ({ newElement }: PostModifyElementArgs): void => {
    const { id, width, color } = get(newElement, "data.icon");
    // Modify the element directly.
    newElement.data.icon.svg = getSvg(id, { width, color });
};

export { getSvg, updateButtonElementIcon, updateIconElement };
